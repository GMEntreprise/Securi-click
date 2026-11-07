import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { useDemoStore } from '../store/demo.store';
import { demoAware } from './demoAware';

const real = { read: jest.fn(async () => 'real') };
const demo = { read: jest.fn(async () => 'demo') };

describe('demoAware', () => {
  afterEach(() => {
    useDemoStore.getState().exit();
    jest.clearAllMocks();
  });

  it('calls only the real implementation outside the demo', async () => {
    await expect(demoAware(real, demo).read()).resolves.toBe('real');
    expect(demo.read).not.toHaveBeenCalled();
  });

  it('calls only the simulated implementation during the demo', async () => {
    useDemoStore.getState().enter('parent');
    await expect(demoAware(real, demo).read()).resolves.toBe('demo');
    expect(real.read).not.toHaveBeenCalled();
  });

  it('follows the mode at call time, not when the service was built', async () => {
    const service = demoAware(real, demo);
    const { read } = service;
    useDemoStore.getState().enter('parent');
    await expect(service.read()).resolves.toBe('demo');
    useDemoStore.getState().exit();
    await expect(service.read()).resolves.toBe('real');
    await expect(read()).resolves.toBe('real');
  });
});
