import { describe, expect, it } from '@jest/globals';
import { DEMO_QR_SCENARIOS, buildDemoLiveToken } from './qrScenarios';
import { DEMO_IDS, createDemoWorld } from './seed';
import { demoLiveCodeFor, evaluateDemoScan } from './engine';
import type { DemoWorld } from './types';

const NOW = new Date('2026-11-07T16:30:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const payloadOf = (id: string) =>
  DEMO_QR_SCENARIOS.find(scenario => scenario.id === id)?.payload ?? '';

function liveToken(
  world: DemoWorld,
  childId: string,
  guardianId: string | null,
  nonce = 'n1'
): string {
  const code = demoLiveCodeFor(world, childId, guardianId, NOW, nonce);
  if (!code) throw new Error('missing child');
  return buildDemoLiveToken(code);
}

function withNina(world: DemoWorld): DemoWorld {
  const sophie = world.guardians.find(g => g.id === DEMO_IDS.sophieEmma);
  if (!sophie) throw new Error('missing guardian');
  return {
    ...world,
    guardians: [
      ...world.guardians,
      {
        ...sophie,
        id: 'demo-guardian-nina',
        first_name: 'Nina',
        last_name: 'Roux',
        relationship: 'Tante',
      },
    ],
  };
}

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
      child: { id: childId },
      guardian: { id: guardianId },
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
      child: { id: DEMO_IDS.lucas, first_name: 'Lucas' },
      guardian: { first_name: 'Alex', last_name: 'Durand' },
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
      child: { id: DEMO_IDS.emma },
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
      child: null,
      guardian: null,
      reasonKey: 'qr_refused_unknown',
    });
  });

  it('validates a code generated in the demo and refuses a forged guardian', () => {
    const world = createDemoWorld(NOW);
    expect(
      evaluateDemoScan(
        world,
        liveToken(world, DEMO_IDS.emma, DEMO_IDS.sophieEmma),
        NOW
      )
    ).toMatchObject({
      status: 'validated',
      guardian: { id: DEMO_IDS.sophieEmma },
    });
    const forged = demoLiveCodeFor(world, DEMO_IDS.emma, null, NOW, 'f');
    if (!forged) throw new Error('missing child');
    expect(
      evaluateDemoScan(
        world,
        buildDemoLiveToken({
          ...forged,
          guardianId: DEMO_IDS.thomasLucas,
          guardian: {
            first_name: 'Thomas',
            last_name: 'Martin',
            relationship: 'Père',
          },
        }),
        NOW
      )
    ).toMatchObject({
      status: 'refused',
      reasonKey: 'qr_refused_unauthorized',
    });
  });

  it('validates on the stand a code generated on a visitor phone', () => {
    const visitor = withNina(createDemoWorld(NOW));
    const stand = createDemoWorld(NOW);
    const token = liveToken(visitor, DEMO_IDS.emma, 'demo-guardian-nina');
    expect(evaluateDemoScan(stand, token, NOW)).toMatchObject({
      status: 'validated',
      child: { id: DEMO_IDS.emma, first_name: 'Emma' },
      guardian: {
        first_name: 'Nina',
        last_name: 'Roux',
        relationship: 'Tante',
      },
      noteKey: 'qr_note_authorized',
    });
  });

  it('validates on the stand a child added on a visitor phone', () => {
    const visitor = createDemoWorld(NOW);
    const emma = visitor.children.find(c => c.id === DEMO_IDS.emma);
    if (!emma) throw new Error('missing child');
    const withLea = {
      ...visitor,
      children: [
        ...visitor.children,
        { ...emma, id: 'demo-child-lea', first_name: 'Léa' },
      ],
    };
    const token = liveToken(withLea, 'demo-child-lea', null);
    expect(evaluateDemoScan(createDemoWorld(NOW), token, NOW)).toMatchObject({
      status: 'validated',
      child: { id: 'demo-child-lea', first_name: 'Léa' },
      guardian: null,
      noteKey: 'qr_note_parent',
    });
  });

  it('refuses a generated code once it has been used on this device', () => {
    const world = createDemoWorld(NOW);
    const token = liveToken(world, DEMO_IDS.emma, null);
    expect(
      evaluateDemoScan({ ...world, usedQrTokens: [token] }, token, NOW)
    ).toMatchObject({
      status: 'refused',
      child: { id: DEMO_IDS.emma },
      reasonKey: 'qr_refused_used',
    });
    expect(
      evaluateDemoScan(
        { ...world, usedQrTokens: [token] },
        liveToken(world, DEMO_IDS.emma, null, 'n2'),
        NOW
      )
    ).toMatchObject({ status: 'validated' });
  });

  it('refuses a generated code after its 24 hours of validity', () => {
    const world = createDemoWorld(NOW);
    const token = liveToken(world, DEMO_IDS.emma, DEMO_IDS.sophieEmma);
    expect(
      evaluateDemoScan(world, token, new Date(NOW.getTime() + DAY_MS + 1))
    ).toMatchObject({ status: 'refused', reasonKey: 'qr_refused_expired' });
  });
});
