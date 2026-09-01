import { describe, expect, it } from '@jest/globals';
import { formatEstablishmentAddress } from './formatEstablishmentAddress';

describe('official establishment address formatting', () => {
  it('drops the address line that merely repeats the postcode and city', () => {
    expect(
      formatEstablishmentAddress({
        address_line_1: '203 avenue Achille Peretti',
        address_line_2: null,
        address_line_3: '92200 NEUILLY SUR SEINE',
        postal_code: '92200',
        city: 'Neuilly-sur-Seine',
      })
    ).toEqual({
      street: '203 avenue Achille Peretti',
      locality: '92200 Neuilly-sur-Seine',
    });
  });

  it('keeps genuine complementary lines', () => {
    expect(
      formatEstablishmentAddress({
        address_line_1: '1 rue Alpha',
        address_line_2: 'Bâtiment Lumière',
        address_line_3: 'Entrée cour',
        postal_code: '75001',
        city: 'Paris',
      })
    ).toEqual({
      street: '1 rue Alpha, Bâtiment Lumière, Entrée cour',
      locality: '75001 Paris',
    });
  });

  it('removes duplicated lines regardless of case and accents', () => {
    expect(
      formatEstablishmentAddress({
        address_line_1: '5 Avenue Vauban',
        address_line_2: '5 avenue vauban',
        address_line_3: null,
        postal_code: '83000',
        city: 'Toulon',
      }).street
    ).toBe('5 Avenue Vauban');
  });

  it('falls back to the locality alone when no street is published', () => {
    expect(
      formatEstablishmentAddress({
        address_line_1: null,
        address_line_2: null,
        address_line_3: null,
        postal_code: '75005',
        city: 'Paris 5e Arrondissement',
      })
    ).toEqual({ street: '', locality: '75005 Paris 5e Arrondissement' });
  });

  it('ignores a line that repeats only the city', () => {
    expect(
      formatEstablishmentAddress({
        address_line_1: '620 rue David',
        address_line_2: 'TOULON',
        address_line_3: null,
        postal_code: '83200',
        city: 'Toulon',
      }).street
    ).toBe('620 rue David');
  });
});
