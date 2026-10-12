import { afterEach, describe, expect, it, vi } from 'vitest';

const { posthog } = vi.hoisted(() => ({
  posthog: vi.fn(() => ({ capture: vi.fn(), shutdown: vi.fn() })),
}));
vi.mock('posthog-node', () => ({ PostHog: posthog }));
vi.mock('../site-settings/get-site-setting', () => ({ getSiteSetting: vi.fn() }));
vi.mock('../site-settings/upsert-site-setting', () => ({ upsertSiteSetting: vi.fn() }));

describe('0xDocHub telemetry policy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('does not start telemetry when credentials exist and the opt-out flag is absent', async () => {
    vi.stubEnv('NEXT_PRIVATE_TELEMETRY_KEY', 'release-canary-key');
    vi.stubEnv('NEXT_PRIVATE_TELEMETRY_HOST', 'https://telemetry.invalid');
    vi.stubEnv('DOCUMENSO_DISABLE_TELEMETRY', undefined);
    vi.stubEnv('NEXT_PRIVATE_DOCUMENSO_LICENSE_KEY', undefined);
    const { TelemetryClient } = await import('./telemetry-client');
    await TelemetryClient.start();
    await TelemetryClient.stop();
    expect(posthog).not.toHaveBeenCalled();
  });
});
