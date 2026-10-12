import { afterEach, describe, expect, it, vi } from 'vitest';

const { posthog } = vi.hoisted(() => ({
  posthog: vi.fn(() => ({ capture: vi.fn(), shutdown: vi.fn() })),
}));
vi.mock('posthog-node', () => ({ PostHog: posthog }));

import { captureServerEvent } from './capture-server-event';

describe('0xDocHub server analytics policy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('does not construct an analytics client even when a key is supplied', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'release-canary-key');
    captureServerEvent({ event: 'signing_canary', userId: 1, properties: { document: 'private' } });
    expect(posthog).not.toHaveBeenCalled();
  });
});
