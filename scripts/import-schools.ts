#!/usr/bin/env -S npx ts-node --esm
/**
 * Script d'import initial des établissements scolaires data.gouv.fr
 * Utilisation : SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/import-schools.ts
 *
 * Télécharge les écoles (maternelles + primaires publiques/privées) depuis
 * l'API officielle Éducation Nationale et les upsert dans la table schools.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL             = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── API data.gouv.fr ──────────────────────────────────────────────────────────

const BASE_URL = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records';
const BATCH_SIZE = 100; // max autorisé par data.gouv.fr
const CONCURRENCY = 5; // upserts en parallèle par batch

interface DataGouvRecord {
  identifiant_de_l_etablissement?: string;
  nom_etablissement?: string;
  type_etablissement?: string;
  statut_public_prive?: string;
  libelle_nature?: string;
  adresse_1?: string;
  adresse_2?: string;
  nom_commune?: string;
  code_postal?: string;
  code_departement?: string;
  ecole_maternelle?: number;
  ecole_elementaire?: number;
  etat?: string;
}

const TYPE_LABELS: Record<string, string> = {
  'ecole maternelle publique':  'École maternelle publique',
  'ecole maternelle privee':    'École maternelle privée',
  'ecole primaire publique':    'École primaire publique',
  'ecole primaire privee':      'École primaire privée',
  'ecole elementaire publique': 'École primaire publique',
  'ecole elementaire privee':   'École primaire privée',
};

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/\p{Mn}/gu, '');
}

function resolveType(r: DataGouvRecord): string {
  const nature = deaccent((r.libelle_nature ?? '').toLowerCase());
  for (const [key, label] of Object.entries(TYPE_LABELS)) {
    if (nature.includes(key)) return label;
  }
  const isPublic = (r.statut_public_prive ?? '').toLowerCase() === 'public';
  if (nature.includes('maternelle')) {
    return isPublic ? 'École maternelle publique' : 'École maternelle privée';
  }
  return isPublic ? 'École primaire publique' : 'École primaire privée';
}

function normalize(r: DataGouvRecord): {
  external_id: string; name: string; type: string;
  address: string; city: string; postal_code: string;
} | null {
  const uai = r.identifiant_de_l_etablissement?.trim();
  if (!uai) return null;
  if ((r.etat ?? '').toUpperCase() === 'FERME') return null;
  const name = r.nom_etablissement?.trim();
  if (!name) return null;
  const address = [r.adresse_1, r.adresse_2].filter(Boolean).join(', ').trim();
  return {
    external_id:  uai,
    name,
    type:         resolveType(r),
    address:      address || (r.nom_commune?.trim() ?? ''),
    city:         r.nom_commune?.trim() ?? '',
    postal_code:  r.code_postal?.trim() ?? '',
  };
}

// Départements français — chaque tranche reste sous 10 000 records
const DEPARTEMENTS = [
  '001','002','003','004','005','006','007','008','009',
  '010','011','012','013','014','015','016','017','018','019',
  '021','022','023','024','025','026','027','028','029',
  '030','031','032','033','034','035','036','037','038','039',
  '040','041','042','043','044','045','046','047','048','049',
  '050','051','052','053','054','055','056','057','058','059',
  '060','061','062','063','064','065','066','067','068','069',
  '070','071','072','073','074','075','076','077','078','079',
  '080','081','082','083','084','085','086','087','088','089',
  '090','091','092','093','094','095',
  '971','972','973','974','976',
  '02A','02B',
];

async function fetchDeptPage(dept: string, offset: number): Promise<{ records: DataGouvRecord[]; total: number }> {
  const where = encodeURIComponent(
    `type_etablissement:"Ecole" AND etat:"OUVERT" AND code_departement:"${dept}"`
  );
  const url = `${BASE_URL}?where=${where}&limit=${BATCH_SIZE}&offset=${offset}&timezone=Europe%2FParis`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const body = await res.json() as { results: DataGouvRecord[]; total_count: number };
  return { records: body.results ?? [], total: body.total_count ?? 0 };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏫  Import établissements data.gouv.fr → Supabase\n');

  let inserted = 0, updated = 0, skipped = 0, errors = 0;
  let page = 0;
  let totalProcessed = 0;

  for (const dept of DEPARTEMENTS) {
    let offset = 0;
    let deptTotal = Infinity;

    while (offset < deptTotal) {
      const { records, total } = await fetchDeptPage(dept, offset);
      deptTotal = total;

      if (records.length === 0) break;
      page++;
      totalProcessed += records.length;

    const schools = records.flatMap(r => {
      const n = normalize(r);
      return n ? [n] : (skipped++, []);
    });

    // Upsert en micro-batches parallèles
    const chunks: typeof schools[] = [];
    for (let i = 0; i < schools.length; i += CONCURRENCY) {
      chunks.push(schools.slice(i, i + CONCURRENCY));
    }

    for (const chunk of chunks) {
      await Promise.all(chunk.map(async school => {
        const { data, error } = await supabase.rpc('upsert_school_from_datagouv', {
          p_external_id:     school.external_id,
          p_name:            school.name,
          p_type:            school.type,
          p_address:         school.address,
          p_city:            school.city,
          p_postal_code:     school.postal_code,
          p_external_source: 'datagouv',
        });
        if (error) { errors++; return; }
        const r = data as { action: string };
        if (r?.action === 'inserted') inserted++;
        else updated++;
      }));
    }

      offset += records.length;
      process.stdout.write(`\r  Dept ${dept} — page ${page} | ~${totalProcessed} traités | +${inserted} ins / ${updated} upd / ${errors} err`);

      if (records.length < BATCH_SIZE) break;
    }
  }

  console.log('\n\n✅  Import terminé');
  console.log(`   Insérés  : ${inserted}`);
  console.log(`   Mis à jour: ${updated}`);
  console.log(`   Ignorés  : ${skipped}`);
  console.log(`   Erreurs  : ${errors}`);
  console.log(`   Total    : ${totalProcessed}`);
}

main().catch(err => { console.error('\n❌', err); process.exit(1); });
