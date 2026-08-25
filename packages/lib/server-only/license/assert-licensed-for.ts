import type { LicenseFlag } from '../../types/license';

type AssertLicensedForOptions = {
  /**
   * Override the AppError code thrown when the assertion fails.
   */
  errorCode?: string;

  /**
   * Override the AppError message thrown when the assertion fails.
   */
  message?: string;
};

/**
 * 0xDocHub research fork: enterprise license assertions are intentionally
 * bypassed so self-hosted deployments can exercise all local EE code paths.
 */
export const assertLicensedFor = async (flag: LicenseFlag, options?: AssertLicensedForOptions): Promise<void> => {
  void flag;
  void options;
};
