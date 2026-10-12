import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', () => ({ default: { writeFile: vi.fn(), readFile: vi.fn() } }));

import { ZCachedLicenseSchema, ZLicenseClaimSchema } from '../../types/license';
import { assertLicensedFor } from './assert-licensed-for';
import { LicenseClient } from './license-client';

describe('0xDocHub local enterprise license', () => {
  afterEach(() => {
    globalThis.__documenso_license_client__ = undefined;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('provides an active schema-valid license covering every current flag without network access', async () => {
    vi.stubEnv('NEXT_PRIVATE_DOCUMENSO_LICENSE_KEY', undefined);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    await LicenseClient.start();
    const client = LicenseClient.getInstance();
    expect(client).not.toBeNull();
    if (!client) {
      throw new Error('License client missing');
    }
    const license = ZCachedLicenseSchema.parse(await client.getCachedLicense());
    if (!license.license) {
      throw new Error('Synthetic license missing');
    }
    expect(license.derivedStatus).toBe('ACTIVE');
    expect(license.unauthorizedFlagUsage).toBe(false);
    expect(license.license.periodEnd.getTime()).toBeGreaterThan(Date.now());
    for (const flag of Object.keys(ZLicenseClaimSchema.shape) as (keyof typeof ZLicenseClaimSchema.shape)[]) {
      expect(license.license.flags[flag]).toBe(true);
      await expect(assertLicensedFor(flag)).resolves.toBeUndefined();
    }
    await client.resync();
    expect(fetch).not.toHaveBeenCalled();
  });
});
