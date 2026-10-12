import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../../errors/app-error';
import { deletedServiceAccountEmail } from './deleted-account';
import { HISTORICAL_SERVICE_ACCOUNT_EMAILS, legacyServiceAccountEmail } from './legacy-service-account';

export const isServiceAccountEmail = (email: string): boolean => {
  const reservedEmails: string[] = [
    ...HISTORICAL_SERVICE_ACCOUNT_EMAILS,
    'deleted-account@documenso.com',
    'deleted-account@0xmetalabs.com',
    legacyServiceAccountEmail(),
    deletedServiceAccountEmail(),
  ];

  return reservedEmails.some((reserved) => reserved.toLowerCase() === email.toLowerCase());
};

export const assertUserNotServiceAccountById = async ({ userId }: { userId: number }): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

  if (!user) {
    throw new AppError(AppErrorCode.NOT_FOUND, { message: 'User not found', statusCode: 404 });
  }

  if (isServiceAccountEmail(user.email)) {
    throw new AppError(AppErrorCode.FORBIDDEN, { message: 'Service account cannot sign in', statusCode: 403 });
  }
};
