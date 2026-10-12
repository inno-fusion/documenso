import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';
import { expect, test } from '@playwright/test';

import { WEBAPP_ORIGIN_HEADERS } from '../../fixtures/authentication';

const hostname = new URL(NEXT_PUBLIC_WEBAPP_URL()).hostname;
const reservedEmails = [
  ...new Set([
    'serviceaccount@documenso.com',
    'serviceaccount@0xmetalabs.com',
    'deleted-account@documenso.com',
    'deleted-account@0xmetalabs.com',
    `serviceaccount@${hostname}`,
    `deleted-account@${hostname}`,
  ]),
];

test.describe('reserved service account addresses', () => {
  for (const email of reservedEmails) {
    test(`rejects password sign-in for ${email}`, async ({ request }) => {
      const csrf = await request.get('/api/auth/csrf');
      expect(csrf.ok()).toBe(true);
      const { csrfToken } = await csrf.json();
      const response = await request.post('/api/auth/email-password/authorize', {
        headers: WEBAPP_ORIGIN_HEADERS,
        data: { email: email.toUpperCase(), password: 'ReservedAccount123!', csrfToken },
      });
      expect(response.status()).toBe(403);
      expect(await response.text()).toBe('FORBIDDEN');
      const session = await request.get('/api/auth/session');
      expect((await session.json()).isAuthenticated).toBe(false);
    });

    test(`rejects sign-up for ${email}`, async ({ request }) => {
      const response = await request.post('/api/auth/email-password/signup', {
        headers: WEBAPP_ORIGIN_HEADERS,
        data: { name: 'Reserved account', email: email.toUpperCase(), password: 'ReservedAccount123!' },
      });
      expect(response.status()).toBe(403);
      expect(await response.text()).toBe('FORBIDDEN');
    });

    test(`rejects password recovery for ${email}`, async ({ request }) => {
      const response = await request.post('/api/auth/email-password/forgot-password', {
        headers: WEBAPP_ORIGIN_HEADERS,
        data: { email: email.toUpperCase() },
      });
      expect(response.status()).toBe(403);
      expect(await response.text()).toBe('FORBIDDEN');
    });
  }
});
