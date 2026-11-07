import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockRpc = jest.fn<(...args: unknown[]) => unknown>();
jest.mock('@/lib/supabase/client', () => ({
  supabase: { rpc: (...args: unknown[]) => mockRpc(...args) },
}));

import { collectorService, QrGenerationError } from './collector.service';

async function failureFor(message: string): Promise<unknown> {
  mockRpc.mockImplementation(async () => ({
    data: null,
    error: { message, code: 'P0001' },
  }));
  return collectorService
    .generateCollectorQrCode('user', 'child', 'guardian')
    .catch((error: unknown) => error);
}

describe('generateCollectorQrCode', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('tells a suspended access apart from a forbidden one', async () => {
    const suspended = await failureFor(
      'forbidden: accès suspendu par le parent'
    );
    expect(suspended).toBeInstanceOf(QrGenerationError);
    expect(suspended).toMatchObject({ reason: 'suspended' });

    const forbidden = await failureFor(
      'forbidden: guardian introuvable ou non autorisé'
    );
    expect(forbidden).toMatchObject({ reason: 'forbidden' });
  });

  it('never shows the raw server message', async () => {
    const error = await failureFor('forbidden: guardian introuvable');
    expect(error instanceof Error ? error.message : '').not.toContain(
      'forbidden'
    );
  });
});
