import { describe, expect, it } from '@jest/globals';
import {
  FRANCE_DEPARTMENT_CODES,
  normalizeOfficialRecord,
} from '../../../../supabase/functions/_shared/educationDirectory';

const officialRecord = {
  identifiant_de_l_etablissement: '0923504J',
  nom_etablissement: 'Ecole élémentaire privée Les Institutions Abravanel',
  type_etablissement: 'Ecole',
  statut_public_prive: 'Privé',
  adresse_1: '203 avenue Achille Peretti',
  adresse_3: '92200 NEUILLY SUR SEINE',
  code_postal: '92200',
  nom_commune: 'Neuilly-sur-Seine',
  code_departement: '092',
  libelle_departement: 'Hauts-de-Seine',
  libelle_academie: 'Versailles',
  libelle_region: 'Ile-de-France',
  libelle_nature: 'ECOLE DE NIVEAU ELEMENTAIRE',
  code_nature: 151,
  ecole_maternelle: 1,
  ecole_elementaire: 1,
  etat: 'OUVERT',
  date_maj_ligne: '2026-08-20',
};

describe('official education mapping', () => {
  it('keeps exact UAI identity and combined official levels', () => {
    const result = normalizeOfficialRecord(
      officialRecord,
      'run-id',
      '2026-09-01T00:00:00.000Z'
    );
    expect(result.value).toMatchObject({
      uai: '0923504J',
      official_name: officialRecord.nom_etablissement,
      sector: 'private',
      has_nursery: true,
      has_elementary: true,
      school_level: 'combined',
      address_line_1: '203 avenue Achille Peretti',
      address_line_2: null,
      address_line_3: '92200 NEUILLY SUR SEINE',
      postal_code: '92200',
      city: 'Neuilly-sur-Seine',
      is_active: true,
    });
  });

  it('rejects malformed UAI and records outside the school type', () => {
    expect(
      normalizeOfficialRecord(
        { ...officialRecord, identifiant_de_l_etablissement: 'bad' },
        'run-id'
      ).reason
    ).toBe('invalid_uai');
    expect(
      normalizeOfficialRecord(
        { ...officialRecord, type_etablissement: 'Collège' },
        'run-id'
      ).reason
    ).toBe('outside_school_type');
  });

  it('keeps first-degree schools that publish no level flag', () => {
    const result = normalizeOfficialRecord(
      { ...officialRecord, ecole_maternelle: 0, ecole_elementaire: 0 },
      'run-id'
    );
    expect(result.reason).toBeUndefined();
    expect(result.value).toMatchObject({
      school_level: 'primary',
      has_nursery: false,
      has_elementary: false,
    });
  });

  it('keeps public and private schools and flags an unpublished status', () => {
    expect(
      normalizeOfficialRecord(
        { ...officialRecord, statut_public_prive: 'Public' },
        'run-id'
      ).value?.sector
    ).toBe('public');
    expect(
      normalizeOfficialRecord(officialRecord, 'run-id').value?.sector
    ).toBe('private');
    const withoutStatus = { ...officialRecord };
    delete (withoutStatus as { statut_public_prive?: string })
      .statut_public_prive;
    const result = normalizeOfficialRecord(withoutStatus, 'run-id');
    expect(result.reason).toBeUndefined();
    expect(result.value?.sector).toBe('unknown');
  });

  it('covers every department the official directory publishes', () => {
    expect(FRANCE_DEPARTMENT_CODES).toHaveLength(107);
    expect(new Set(FRANCE_DEPARTMENT_CODES).size).toBe(
      FRANCE_DEPARTMENT_CODES.length
    );
    for (const code of [
      '075',
      '083',
      '02A',
      '02B',
      '975',
      '976',
      '977',
      '978',
      '986',
      '987',
      '988',
    ]) {
      expect(FRANCE_DEPARTMENT_CODES).toContain(code);
    }
  });

  it('retains closure state when a closed record is mapped', () => {
    expect(
      normalizeOfficialRecord({ ...officialRecord, etat: 'FERME' }, 'run-id')
        .value?.is_active
    ).toBe(false);
  });
});
