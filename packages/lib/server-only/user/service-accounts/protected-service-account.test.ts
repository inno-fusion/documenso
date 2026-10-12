import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  assertNotDisabled: vi.fn(),
  createSession: vi.fn(),
  generateSessionToken: vi.fn(() => 'test-session'),
  setSessionCookie: vi.fn(),
}));

vi.mock('@documenso/prisma', () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock('../assert-user-not-disabled', () => ({ assertUserNotDisabledById: mocks.assertNotDisabled }));
vi.mock('@documenso/auth/server/lib/session/session', () => ({
  createSession: mocks.createSession,
  generateSessionToken: mocks.generateSessionToken,
}));
vi.mock('@documenso/auth/server/lib/session/session-cookies', () => ({ setSessionCookie: mocks.setSessionCookie }));

import { onAuthorize } from '@documenso/auth/server/lib/utils/authorizer';

import { assertUserNotServiceAccountById, isServiceAccountEmail } from './protected-service-account';

const context = { get: vi.fn(() => ({ ipAddress: '127.0.0.1' })) } as unknown as Parameters<typeof onAuthorize>[1];
const reserved = [
  'serviceaccount@documenso.com',
  'serviceaccount@0xmetalabs.com',
  'deleted-account@documenso.com',
  'deleted-account@0xmetalabs.com',
  'serviceaccount@release.example',
  'deleted-account@release.example',
];

describe('service account sign-in protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_WEBAPP_URL', 'https://release.example/ESign');
    vi.stubEnv('NEXT_PRIVATE_LEGACY_SERVICE_ACCOUNT_EMAIL', undefined);
    vi.stubEnv('NEXT_PRIVATE_DELETED_SERVICE_ACCOUNT_EMAIL', undefined);
    mocks.assertNotDisabled.mockResolvedValue(undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(reserved)('blocks %s before any sign-in path can issue a session', async (email) => {
    expect(isServiceAccountEmail(email.toUpperCase())).toBe(true);
    mocks.findUnique.mockResolvedValue({ email });
    await expect(onAuthorize({ userId: 1 }, context)).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });

  it('protects explicit override addresses case-insensitively', () => {
    vi.stubEnv('NEXT_PRIVATE_LEGACY_SERVICE_ACCOUNT_EMAIL', 'Legacy@private.example');
    vi.stubEnv('NEXT_PRIVATE_DELETED_SERVICE_ACCOUNT_EMAIL', 'Deleted@private.example');
    expect(isServiceAccountEmail('legacy@private.example')).toBe(true);
    expect(isServiceAccountEmail('DELETED@PRIVATE.EXAMPLE')).toBe(true);
  });

  it('does not block an ordinary user merely named serviceaccount', async () => {
    mocks.findUnique.mockResolvedValue({ email: 'serviceaccount@customer.example' });
    expect(isServiceAccountEmail('serviceaccount@customer.example')).toBe(false);
    await expect(onAuthorize({ userId: 42 }, context)).resolves.toBeUndefined();
    expect(mocks.assertNotDisabled).toHaveBeenCalledWith({ userId: 42 });
    expect(mocks.createSession).toHaveBeenCalledOnce();
    expect(mocks.setSessionCookie).toHaveBeenCalledOnce();
  });

  it('refuses to authorize a missing account', async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(assertUserNotServiceAccountById({ userId: 1 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('preserves the disabled-account guard before creating a session', async () => {
    mocks.assertNotDisabled.mockRejectedValueOnce(new Error('Account disabled'));
    await expect(onAuthorize({ userId: 1 }, context)).rejects.toThrow('Account disabled');
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});
