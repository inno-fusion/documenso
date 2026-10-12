/**
 * The flag name for global session recording feature flag.
 */
export const FEATURE_FLAG_GLOBAL_SESSION_RECORDING = 'global_session_recording';

/** 0xDocHub never enables product analytics, including with inherited keys. */
export function extractPostHogConfig(): { key: string; host: string } | null {
  return null;
}
