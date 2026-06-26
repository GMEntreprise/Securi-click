#!/usr/bin/env -S npx ts-node --esm
/**
 * Ajout MANUEL d'un établissement absent de l'annuaire data.gouv.fr
 * (école privée hors contrat, crèche, structure récente, etc.).
 *
 * Utilisation :
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   SCHOOL_NAME="Hernes Ronan" \
 *   SCHOOL_TYPE="École primaire privée" \
 *   SCHOOL_CITY="Toulon" \
 *   SCHOOL_POSTAL="83000" \
 *   SCHOOL_ADDRESS="12 rue ..." \
 *   [SCHOOL_EMAIL="contact@..."] [SCHOOL_PHONE="04..."] \
 *   npx ts-node scripts/add-school.ts
 *
 * Idempotent : si une école au même nom + code postal existe déjà,
 * elle est mise à jour au lieu d'être dupliquée. Insérée comme
 * verified=true (remonte en tête de la recherche) et external_source='manual'.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis');
  process.exit(1);
}

const VALID_TYPES = [
  'École maternelle publique',
  'École maternelle privée',
  'École primaire publique',
  'École primaire privée',
];

const name = (process.env.SCHOOL_NAME ?? '').trim();
const type = (process.env.SCHOOL_TYPE ?? '').trim();
const city = (process.env.SCHOOL_CITY ?? '').trim();
const postal = (process.env.SCHOOL_POSTAL ?? '').trim();
const address = (process.env.SCHOOL_ADDRESS ?? '').trim() || city;
const phone = (process.env.SCHOOL_PHONE ?? '').trim();

if (!name || !city || !postal) {
  console.error('❌  SCHOOL_NAME, SCHOOL_CITY et SCHOOL_POSTAL sont requis');
  process.exit(1);
}
if (!VALID_TYPES.includes(type)) {
  console.error(
    `❌  SCHOOL_TYPE invalide. Valeurs autorisées :\n   - ${VALID_TYPES.join('\n   - ')}`
  );
  process.exit(1);
}

// Email unique synthétique si non fourni (la colonne est NOT NULL UNIQUE)
const slug = `${name}-${postal}`
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Mn}/gu, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
const email =
  (process.env.SCHOOL_EMAIL ?? '').trim() || `${slug}@manual.securiclick.app`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Déjà présente ? (même nom + code postal)
  const { data: existing } = await supabase
    .from('schools')
    .select('id, name, city')
    .ilike('name', name)
    .eq('postal_code', postal)
    .maybeSingle();

  const payload = {
    name,
    type,
    email,
    phone,
    address,
    city,
    postal_code: postal,
    manager_first_name: '',
    manager_last_name: '',
    manager_function: 'Responsable',
    verified: true,
    external_source: 'manual',
  };

  if (existing) {
    const { error } = await supabase
      .from('schools')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw error;
    console.log(
      `♻️  Mise à jour : ${name} (${city} ${postal}) — id ${existing.id}`
    );
  } else {
    const { data, error } = await supabase
      .from('schools')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    console.log(`✅  Ajoutée : ${name} (${city} ${postal}) — id ${data.id}`);
  }
}

main().catch(err => {
  console.error('\n❌', err.message ?? err);
  process.exit(1);
});
