import { renderWithI18N } from '@documenso/email/render';
import { DocumentCompletedEmailTemplate } from '@documenso/email/templates/document-completed';
import { ResetPasswordTemplate } from '@documenso/email/templates/reset-password';
import { setupI18n } from '@lingui/core';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

const i18n = setupI18n({ locale: 'en', messages: { en: {} } });
const assetBaseUrl = 'https://release.example/ESign';

describe('0xDocHub rendered email regression', () => {
  it('preserves the report link, fork footer and sub-path assets', async () => {
    const html = await renderWithI18N(
      createElement(DocumentCompletedEmailTemplate, {
        documentName: 'Release canary',
        assetBaseUrl,
        reportUrl: 'https://release.example/report/canary',
      }),
      { i18n },
    );
    expect(html).toContain('https://release.example/ESign/static/logo.png');
    expect(html).toContain('https://release.example/report/canary');
    expect(html).toContain('0xDocHub by 0xMetaLabs');
    expect(html).not.toContain('documen.so');
    expect(html).not.toContain('documenso.com');
  });

  it.each([
    'RESET',
    'UPDATE',
  ] as const)('preserves %s password notifications and local support links', async (source) => {
    const html = await renderWithI18N(createElement(ResetPasswordTemplate, { source, assetBaseUrl }), { i18n });
    expect(html).toContain('https://release.example/ESign/static/logo.png');
    expect(html).toContain('mailto:hi@0xmetalabs.com');
    expect(html).not.toContain('documenso.com');
    expect(html).toContain(source === 'RESET' ? 'changed your password as you asked' : 'account security settings');
  });
});
