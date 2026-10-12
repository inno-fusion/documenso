import { afterEach, describe, expect, it, vi } from 'vitest';

import { extractPostHogConfig } from './feature-flags';

describe('0xDocHub browser analytics policy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('does not expose analytics config even when a key is supplied', () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'release-canary-key');
    expect(extractPostHogConfig()).toBeNull();
  });
});
