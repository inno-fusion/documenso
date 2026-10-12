import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
}));

vi.mock('@documenso/prisma', () => ({ prisma: db }));

import { legacyServiceAccountEmail, migrateLegacyServiceAccount } from './legacy-service-account';

const target = 'serviceaccount@release.example';
const historicalEmails = ['serviceaccount@documenso.com', 'serviceaccount@0xmetalabs.com'];

const seedRows = (emails: string[]) => {
  const rows = emails.map((email, id) => ({ id: id + 1, email }));
  db.user.findUnique.mockImplementation(({ where }: { where: { email: string } }) => {
    return rows.find((row) => row.email === where.email) ?? null;
  });
  db.user.findMany.mockImplementation(({ where }: { where: { email: { in: string[] } } }) => {
    return rows.filter((row) => where.email.in.includes(row.email));
  });
  db.user.updateMany.mockImplementation(({ where, data }) => {
    const matches = rows.filter((row) => {
      const emailMatches =
        typeof where.email === 'string' ? row.email === where.email : where.email.in.includes(row.email);
      return emailMatches && (where.id === undefined || where.id === row.id);
    });
    for (const row of matches) {
      if (rows.some((other) => other.id !== row.id && other.email === data.email)) {
        throw new Error('Unique email collision');
      }
      row.email = data.email;
    }
    return { count: matches.length };
  });
  return rows;
};

describe('historical service account identity migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_WEBAPP_URL', 'https://release.example/ESign');
    vi.stubEnv('NEXT_PRIVATE_LEGACY_SERVICE_ACCOUNT_EMAIL', undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(historicalEmails)('migrates %s without changing the account ID', async (email) => {
    const rows = seedRows([email]);
    await migrateLegacyServiceAccount();
    expect(rows).toEqual([{ id: 1, email: target }]);
    await migrateLegacyServiceAccount();
    expect(rows).toEqual([{ id: 1, email: target }]);
  });

  it('does not merge identities or collide when both historical accounts exist', async () => {
    const rows = seedRows(historicalEmails);
    await expect(migrateLegacyServiceAccount()).resolves.toBeUndefined();
    expect(rows.map((row) => row.email)).toEqual(historicalEmails);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it('keeps historical identities intact when the target account already exists', async () => {
    const rows = seedRows([...historicalEmails, target]);
    await expect(migrateLegacyServiceAccount()).resolves.toBeUndefined();
    expect(rows.map((row) => row.email)).toEqual([...historicalEmails, target]);
    expect(db.user.updateMany).not.toHaveBeenCalled();
  });

  it('tolerates a concurrent startup claiming the target without merging IDs', async () => {
    const rows = seedRows(['serviceaccount@0xmetalabs.com']);
    db.user.updateMany.mockImplementationOnce(() => {
      rows.push({ id: 99, email: target });
      throw Object.assign(new Error('Unique email collision'), { code: 'P2002' });
    });
    await expect(migrateLegacyServiceAccount()).resolves.toBeUndefined();
    expect(rows).toEqual([
      { id: 1, email: 'serviceaccount@0xmetalabs.com' },
      { id: 99, email: target },
    ]);
  });

  it('does not swallow genuine database failures', async () => {
    seedRows(['serviceaccount@0xmetalabs.com']);
    db.user.updateMany.mockRejectedValueOnce(new Error('Database unavailable'));
    await expect(migrateLegacyServiceAccount()).rejects.toThrow('Database unavailable');
  });

  it('honors an explicit account address override', async () => {
    vi.stubEnv('NEXT_PRIVATE_LEGACY_SERVICE_ACCOUNT_EMAIL', 'internal@custom.example');
    const rows = seedRows(['serviceaccount@0xmetalabs.com']);
    await migrateLegacyServiceAccount();
    expect(legacyServiceAccountEmail()).toBe('internal@custom.example');
    expect(rows[0].email).toBe('internal@custom.example');
  });
});
