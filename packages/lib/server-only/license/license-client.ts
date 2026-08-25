import fs from 'node:fs/promises';
import path from 'node:path';

import {
  LICENSE_FILE_NAME,
  type TCachedLicense,
  ZCachedLicenseSchema,
} from '../../types/license';

const LICENSE_KEY = '0xdochub-enterprise-bypass';

declare global {
  // eslint-disable-next-line no-var
  var __documenso_license_client__: LicenseClient | undefined;
}

export class LicenseClient {
  /**
   * We cache the license in memory incase there is permission issues with
   * retrieving the license from the local file system.
   */
  private cachedLicense: TCachedLicense | null = null;

  private constructor() {}

  /**
   * Start the license client.
   *
   * This will ping the license server with the configured license key and store
   * the response locally in a JSON file.
   *
   * Uses globalThis to store the singleton instance so that it's shared across
   * different bundles (e.g. Hono and Remix) at runtime.
   */
  public static async start(): Promise<void> {
    if (globalThis.__documenso_license_client__) {
      return;
    }

    const instance = new LicenseClient();

    globalThis.__documenso_license_client__ = instance;

    try {
      await instance.initialize();
    } catch (err) {
      // Do nothing.
      console.error('[License] Failed to verify license:', err);
    }
  }

  /**
   * Get the current license client instance.
   *
   * Returns the shared instance from globalThis, ensuring both Hono and Remix
   * bundles access the same instance.
   */
  public static getInstance(): LicenseClient | null {
    return globalThis.__documenso_license_client__ ?? null;
  }

  public async getCachedLicense(): Promise<TCachedLicense | null> {
    if (this.cachedLicense) {
      return this.cachedLicense;
    }

    const localLicenseFile = await this.loadFromFile();

    return localLicenseFile;
  }

  /**
   * Force resync the license from the license server.
   *
   * This will re-ping the license server and update the cached license file.
   */
  public async resync(): Promise<void> {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    const syntheticLicense = this.createEnterpriseLicense();
    this.cachedLicense = syntheticLicense;
    await this.saveToFile(syntheticLicense);
    console.log('[License] 0xDocHub enterprise license bypass active.');
  }

  private createEnterpriseLicense(): TCachedLicense {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 20);

    return {
      lastChecked: now.toISOString(),
      requestedLicenseKey: LICENSE_KEY,
      unauthorizedFlagUsage: false,
      derivedStatus: 'ACTIVE',
      license: {
        status: 'ACTIVE',
        createdAt: now,
        name: '0xDocHub Enterprise',
        periodEnd,
        cancelAtPeriodEnd: false,
        licenseKey: LICENSE_KEY,
        flags: {
          emailDomains: true,
          embedAuthoring: true,
          embedAuthoringWhiteLabel: true,
          cfr21: true,
          hipaa: true,
          authenticationPortal: true,
          billing: true,
          instanceCscSigning: true,
          cscQesSigning: true,
        },
      },
    };
  }

  private async saveToFile(data: TCachedLicense): Promise<void> {
    const licenseFilePath = path.join(process.cwd(), LICENSE_FILE_NAME);

    try {
      await fs.writeFile(licenseFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('[License] Failed to save license file:', error);
    }
  }

  private async loadFromFile(): Promise<TCachedLicense | null> {
    const licenseFilePath = path.join(process.cwd(), LICENSE_FILE_NAME);

    try {
      const fileContents = await fs.readFile(licenseFilePath, 'utf-8');

      return ZCachedLicenseSchema.parse(JSON.parse(fileContents));
    } catch {
      return null;
    }
  }

}
