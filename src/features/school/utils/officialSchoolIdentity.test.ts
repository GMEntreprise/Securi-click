import { describe, expect, it } from '@jest/globals';
import { getOfficialSchoolUai } from './officialSchoolIdentity';

describe('getOfficialSchoolUai', () => {
  it('returns a normalized UAI for an officially linked school', () => {
    expect(
      getOfficialSchoolUai({
        education_establishment_id: '10000000-0000-0000-0000-000000000001',
        external_id: ' 0750001a ',
      })
    ).toBe('0750001A');
  });

  it('does not expose a legacy external identifier as an UAI', () => {
    expect(
      getOfficialSchoolUai({
        education_establishment_id: null,
        external_id: '0750001A',
      })
    ).toBeNull();
  });

  it('rejects an invalid identifier on a linked school', () => {
    expect(
      getOfficialSchoolUai({
        education_establishment_id: '10000000-0000-0000-0000-000000000001',
        external_id: 'BAD',
      })
    ).toBeNull();
  });
});
