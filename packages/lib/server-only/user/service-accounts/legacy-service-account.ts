import { prisma } from '@documenso/prisma';

const LEGACY_SERVICE_ACCOUNT_EMAIL = 'serviceaccount@documenso.com';
export const HISTORICAL_SERVICE_ACCOUNT_EMAILS = [
  LEGACY_SERVICE_ACCOUNT_EMAIL,
  'serviceaccount@0xmetalabs.com',
] as const;

export const legacyServiceAccountEmail = () => {
  try {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    if (process.env.NEXT_PRIVATE_LEGACY_SERVICE_ACCOUNT_EMAIL) {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      return process.env.NEXT_PRIVATE_LEGACY_SERVICE_ACCOUNT_EMAIL;
    }

    const { hostname } = new URL(process.env.NEXT_PUBLIC_WEBAPP_URL || 'http://localhost:3000');

    return `serviceaccount@${hostname}`;
  } catch {
    return LEGACY_SERVICE_ACCOUNT_EMAIL;
  }
};

export const migrateLegacyServiceAccount = async () => {
  const targetEmail = legacyServiceAccountEmail();
  const targetAccount = await prisma.user.findUnique({ where: { email: targetEmail }, select: { id: true } });

  if (targetAccount) {
    return;
  }

  const historicalAccounts = await prisma.user.findMany({
    where: { email: { in: [...HISTORICAL_SERVICE_ACCOUNT_EMAILS] } },
    select: { id: true, email: true },
  });

  // Never merge account identities; every historical alias remains blocked by auth.
  if (historicalAccounts.length !== 1) {
    return;
  }

  const account = historicalAccounts[0];
  try {
    await prisma.user.updateMany({
      where: { id: account.id, email: account.email },
      data: { email: targetEmail },
    });
  } catch (error) {
    // Another startup may have claimed the target after the initial lookup.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      const concurrentTarget = await prisma.user.findUnique({ where: { email: targetEmail }, select: { id: true } });
      if (concurrentTarget) {
        return;
      }
    }
    throw error;
  }
};
