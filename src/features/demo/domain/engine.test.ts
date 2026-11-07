import { describe, expect, it } from '@jest/globals';
import { DEMO_QR_SCENARIOS, buildDemoLiveToken } from './qrScenarios';
import { DEMO_IDS, createDemoWorld } from './seed';
import { evaluateDemoScan } from './engine';

const NOW = new Date('2026-11-07T16:30:00.000Z');
const payloadOf = (id: string) =>
  DEMO_QR_SCENARIOS.find(scenario => scenario.id === id)?.payload ?? '';

describe('demo world', () => {
  it('only contains fictional, photo-free people', () => {
    const world = createDemoWorld(NOW);
    expect(world.children.every(child => child.photo_url === null)).toBe(true);
    expect(world.guardians.every(guardian => guardian.photo_url === null)).toBe(
      true
    );
    expect(world.school.name).toBe('École des Tilleuls');
    expect(world.children).toHaveLength(5);
    expect(new Set(world.children.map(child => child.class_name)).size).toBe(2);
    const contacts = world.guardians.flatMap(g => [
      g.email ?? '',
      g.phone ?? '',
    ]);
    for (const contact of contacts.filter(c => c.includes('@'))) {
      expect(contact.endsWith('.invalid')).toBe(true);
    }
  });

  it('never reuses a uuid-shaped identifier that could match production rows', () => {
    const world = createDemoWorld(NOW);
    const ids = [...world.children, ...world.guardians].map(row => row.id);
    expect(ids.every(id => id.startsWith('demo-'))).toBe(true);
  });
});

describe('evaluateDemoScan', () => {
  it.each([
    [
      'authorized-grandmother',
      DEMO_IDS.emma,
      DEMO_IDS.sophieEmma,
      'qr_note_authorized',
    ],
    [
      'authorized-father',
      DEMO_IDS.lucas,
      DEMO_IDS.thomasLucas,
      'qr_note_child_specific',
    ],
    ['temporary-nanny', DEMO_IDS.emma, DEMO_IDS.julieEmma, 'qr_note_temporary'],
  ])('validates %s', (scenario, childId, guardianId, noteKey) => {
    const outcome = evaluateDemoScan(
      createDemoWorld(NOW),
      payloadOf(scenario),
      NOW
    );
    expect(outcome).toMatchObject({
      status: 'validated',
      childId,
      guardianId,
      noteKey,
    });
  });

  it('refuses a person with no authorization for that child', () => {
    const outcome = evaluateDemoScan(
      createDemoWorld(NOW),
      payloadOf('unauthorized-person'),
      NOW
    );
    expect(outcome).toMatchObject({
      status: 'refused',
      childId: DEMO_IDS.lucas,
      guardianId: null,
      reasonKey: 'qr_refused_unauthorized',
    });
  });

  it('refuses an expired code', () => {
    const outcome = evaluateDemoScan(
      createDemoWorld(NOW),
      payloadOf('expired-code'),
      NOW
    );
    expect(outcome).toMatchObject({
      status: 'refused',
      childId: DEMO_IDS.emma,
      reasonKey: 'qr_refused_expired',
    });
  });

  it('gives the same answer every time a printed code is scanned', () => {
    const world = createDemoWorld(NOW);
    const first = evaluateDemoScan(
      world,
      payloadOf('authorized-grandmother'),
      NOW
    );
    const second = evaluateDemoScan(
      world,
      payloadOf('authorized-grandmother'),
      NOW
    );
    expect(second).toEqual(first);
  });

  it('honours a revocation made in the parent journey', () => {
    const world = createDemoWorld(NOW);
    const revoked = {
      ...world,
      guardians: world.guardians.map(guardian =>
        guardian.id === DEMO_IDS.sophieEmma
          ? { ...guardian, is_active: false }
          : guardian
      ),
    };
    expect(
      evaluateDemoScan(revoked, payloadOf('authorized-grandmother'), NOW)
    ).toMatchObject({ status: 'refused', reasonKey: 'qr_refused_revoked' });
  });

  it('expires a temporary authorization once its date has passed', () => {
    const later = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect(
      evaluateDemoScan(
        createDemoWorld(NOW),
        payloadOf('temporary-nanny'),
        later
      )
    ).toMatchObject({
      status: 'refused',
      reasonKey: 'qr_refused_authorization_expired',
    });
  });

  it('refuses anything that is not a demo code, real tokens included', () => {
    expect(
      evaluateDemoScan(createDemoWorld(NOW), 'SC-TESTTOKEN0001', NOW)
    ).toEqual({
      status: 'refused',
      childId: null,
      guardianId: null,
      reasonKey: 'qr_refused_unknown',
    });
  });

  it('validates a code generated in the demo and refuses a forged guardian', () => {
    const world = createDemoWorld(NOW);
    expect(
      evaluateDemoScan(
        world,
        buildDemoLiveToken(DEMO_IDS.emma, DEMO_IDS.sophieEmma),
        NOW
      )
    ).toMatchObject({ status: 'validated', guardianId: DEMO_IDS.sophieEmma });
    expect(
      evaluateDemoScan(
        world,
        buildDemoLiveToken(DEMO_IDS.emma, DEMO_IDS.thomasLucas),
        NOW
      )
    ).toMatchObject({
      status: 'refused',
      reasonKey: 'qr_refused_unauthorized',
    });
    expect(
      evaluateDemoScan(
        world,
        buildDemoLiveToken('child-from-production', null),
        NOW
      )
    ).toMatchObject({ status: 'refused', reasonKey: 'qr_refused_unknown' });
  });
});
