import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Edge Function : sync-schools
//
// Appelle l'API data.gouv.fr / Éducation Nationale pour récupérer les
// établissements scolaires français (maternelles + primaires publics/privés),
// normalise les données et les upsert dans la table schools via RPC.
//
// Déclenchement :
//   - Cron Supabase (nightly) ou appel manuel avec Authorization: Bearer SERVICE_ROLE_KEY
//
// Paramètres optionnels (query string) :
//   - page : numéro de page (défaut 0, 0-indexed)
//   - limit : nombre par page (défaut 500, max 10000)
//   - type_filter : ex. "ecole" pour ne syncer que les écoles
// ──────────────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Types data.gouv.fr ────────────────────────────────────────────────────────

interface DataGouvRecord {
  identifiant_de_l_etablissement?: string; // UAI / RNE code
  nom_etablissement?: string;
  type_etablissement?: string;             // "Ecole", "Collège", "Lycée"
  statut_public_prive?: string;            // "Public" | "Privé"
  libelle_nature?: string;                 // "ECOLE MATERNELLE PUBLIQUE" etc.
  adresse_1?: string;
  adresse_2?: string;
  libelle_commune?: string;
  code_postal_uai?: string;
  etat?: string;                           // "OUVERT" | "FERME"
}

interface NormalizedSchool {
  external_id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  postal_code: string;
}

// ── Mapping type data.gouv → label app ───────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  'ecole maternelle publique':  'École maternelle publique',
  'ecole maternelle privee':    'École maternelle privée',
  'ecole primaire publique':    'École primaire publique',
  'ecole primaire privee':      'École primaire privée',
  'ecole elementaire publique': 'École primaire publique',
  'ecole elementaire privee':   'École primaire privée',
};

function resolveType(record: DataGouvRecord): string {
  const nature = (record.libelle_nature ?? '').toLowerCase()
    .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e')
    .replace(/à/g, 'a').replace(/î/g, 'i').replace(/ô/g, 'o');
  for (const [key, label] of Object.entries(TYPE_LABELS)) {
    if (nature.includes(key)) return label;
  }
  const typeRaw  = (record.type_etablissement ?? '').toLowerCase();
  const statut   = (record.statut_public_prive ?? '').toLowerCase();
  const isPublic = statut === 'public';
  if (typeRaw === 'ecole' || nature.includes('maternelle')) {
    return isPublic ? 'École maternelle publique' : 'École maternelle privée';
  }
  if (typeRaw === 'ecole') {
    return isPublic ? 'École primaire publique' : 'École primaire privée';
  }
  return record.type_etablissement ?? 'École';
}

function normalizeRecord(r: DataGouvRecord): NormalizedSchool | null {
  const uai = r.identifiant_de_l_etablissement?.trim();
  if (!uai) return null;
  if ((r.etat ?? '').toUpperCase() === 'FERME') return null;

  const name = r.nom_etablissement?.trim();
  if (!name) return null;

  const address = [r.adresse_1, r.adresse_2].filter(Boolean).join(', ').trim();
  const city    = r.libelle_commune?.trim() ?? '';
  const postal  = r.code_postal_uai?.trim() ?? '';

  return {
    external_id:  uai,
    name,
    type:         resolveType(r),
    address:      address || city,
    city,
    postal_code:  postal,
  };
}

// ── Fetch data.gouv.fr ────────────────────────────────────────────────────────

const DATAGOUV_BASE = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records';

// Filtre sur les types ciblés : maternelles + primaires/élémentaires uniquement
const TYPE_FILTER = [
  'Ecole',
].join(' OR type_etablissement:');

async function fetchPage(offset: number, limit: number): Promise<{
  records: DataGouvRecord[];
  total: number;
}> {
  // Filtre sur les établissements ouverts + écoles uniquement
  const where = encodeURIComponent(
    `type_etablissement:"Ecole" AND etat:"OUVERT"`
  );
  const url = `${DATAGOUV_BASE}?where=${where}&limit=${limit}&offset=${offset}&timezone=Europe%2FParis`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`data.gouv.fr HTTP ${res.status}: ${await res.text()}`);
  }

  const body = await res.json() as { results: DataGouvRecord[]; total_count: number };
  return {
    records: body.results ?? [],
    total:   body.total_count ?? 0,
  };
}

// ── Handler principal ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  // Authentification : service_role uniquement
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader.includes(serviceKey)) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceKey,
  );

  const url    = new URL(req.url);
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '500'), 10000);
  const maxPages = parseInt(url.searchParams.get('max_pages') ?? '20');

  let inserted = 0;
  let updated  = 0;
  let skipped  = 0;
  let errors   = 0;
  let offset   = 0;
  let total    = Infinity;
  let page     = 0;

  try {
    while (offset < total && page < maxPages) {
      const { records, total: totalCount } = await fetchPage(offset, limit);
      total = totalCount;

      for (const record of records) {
        const school = normalizeRecord(record);
        if (!school) { skipped++; continue; }

        const { data, error } = await supabase.rpc('upsert_school_from_datagouv', {
          p_external_id:     school.external_id,
          p_name:            school.name,
          p_type:            school.type,
          p_address:         school.address,
          p_city:            school.city,
          p_postal_code:     school.postal_code,
          p_external_source: 'datagouv',
        });

        if (error) {
          errors++;
          console.error('[sync-schools] RPC error:', error.message, school.external_id);
          continue;
        }

        const result = data as { success: boolean; action: string };
        if (result?.action === 'inserted') inserted++;
        else if (result?.action === 'updated') updated++;
      }

      offset += records.length;
      page++;

      if (records.length < limit) break;
    }

    const summary = { success: true, inserted, updated, skipped, errors, total_processed: offset };
    console.log('[sync-schools]', summary);
    return json(summary);

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sync-schools] Fatal:', message);
    return json({ success: false, error: message, inserted, updated, skipped, errors }, 500);
  }
});
