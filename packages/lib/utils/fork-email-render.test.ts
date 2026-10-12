import type { BrandingSettings } from '@documenso/email/providers/branding';
import { renderWithI18N } from '@documenso/email/render';
import { AccessAuth2FAEmailTemplate } from '@documenso/email/templates/access-auth-2fa';
import { AdminUserCreatedTemplate } from '@documenso/email/templates/admin-user-created';
import { BulkSendCompleteEmail } from '@documenso/email/templates/bulk-send-complete';
import { ConfirmEmailTemplate } from '@documenso/email/templates/confirm-email';
import { ConfirmTeamEmailTemplate } from '@documenso/email/templates/confirm-team-email';
import { DocumentCancelTemplate } from '@documenso/email/templates/document-cancel';
import { DocumentCompletedEmailTemplate } from '@documenso/email/templates/document-completed';
import { DocumentCreatedFromDirectTemplateEmailTemplate } from '@documenso/email/templates/document-created-from-direct-template';
import { DocumentInviteEmailTemplate } from '@documenso/email/templates/document-invite';
import { DocumentPendingEmailTemplate } from '@documenso/email/templates/document-pending';
import { DocumentRecipientSignedEmailTemplate } from '@documenso/email/templates/document-recipient-signed';
import { DocumentRejectedEmail } from '@documenso/email/templates/document-rejected';
import { DocumentRejectionConfirmedEmail } from '@documenso/email/templates/document-rejection-confirmed';
import { DocumentReminderEmailTemplate } from '@documenso/email/templates/document-reminder';
import { DocumentSelfSignedEmailTemplate } from '@documenso/email/templates/document-self-signed';
import { DocumentSuperDeleteEmailTemplate } from '@documenso/email/templates/document-super-delete';
import { ForgotPasswordTemplate } from '@documenso/email/templates/forgot-password';
import { OrganisationAccountLinkConfirmationTemplate } from '@documenso/email/templates/organisation-account-link-confirmation';
import { OrganisationDeleteEmailTemplate } from '@documenso/email/templates/organisation-delete';
import { OrganisationInviteEmailTemplate } from '@documenso/email/templates/organisation-invite';
import { OrganisationJoinEmailTemplate } from '@documenso/email/templates/organisation-join';
import { OrganisationLeaveEmailTemplate } from '@documenso/email/templates/organisation-leave';
import { OrganisationLimitAlertEmailTemplate } from '@documenso/email/templates/organisation-limit-alert';
import { OrganisationLimitsUpdatedEmailTemplate } from '@documenso/email/templates/organisation-limits-updated';
import { RecipientExpiredTemplate } from '@documenso/email/templates/recipient-expired';
import { RecipientRemovedByAdminEmailTemplate } from '@documenso/email/templates/recipient-removed-by-admin';
import { RecipientRemovedFromDocumentTemplate } from '@documenso/email/templates/recipient-removed-from-document';
import { ResetPasswordTemplate } from '@documenso/email/templates/reset-password';
import { TeamDeleteEmailTemplate } from '@documenso/email/templates/team-delete';
import { TeamEmailRemovedTemplate } from '@documenso/email/templates/team-email-removed';
import { setupI18n } from '@lingui/core';
import { OrganisationType, RecipientRole } from '@prisma/client';
import { colord } from 'colord';
import { type DefaultTreeAdapterMap, parse } from 'parse5';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND_COLORS } from '../constants/theme';
import type { EmailBrandingColors } from './email-branding-colors';

const i18n = setupI18n({ locale: 'en', messages: { en: {} } });
const assetBaseUrl = 'https://release.example/ESign';
const forkUrl = 'https://dochub.ngx.0xmetalabs.com';
const logoUrl = 'https://tenant.example/custom-logo.png';
const websiteUrl = 'https://tenant.example/company';
const reportUrl = 'https://release.example/report/canary';
const common = { assetBaseUrl };

// Include every email template, including ones affected only by the shared footer.
const templates = [
  {
    name: 'bulk-send-complete',
    element: createElement(BulkSendCompleteEmail, {
      userName: 'Canary User',
      templateName: 'Canary Template',
      totalProcessed: 2,
      successCount: 1,
      failedCount: 1,
      errors: ['Canary row failure'],
    }),
    forkText: [],
  },
  {
    name: 'organisation-delete',
    element: createElement(OrganisationDeleteEmailTemplate, { ...common, organisationName: 'Canary Organisation' }),
    forkText: [],
  },
  {
    name: 'organisation-limit-alert',
    element: createElement(OrganisationLimitAlertEmailTemplate, {
      ...common,
      organisationName: 'Canary Organisation',
      counter: 'email',
      kind: 'quota',
      period: '2026-10',
    }),
    forkText: ['support@0xmetalabs.com'],
  },
  {
    name: 'organisation-limits-updated',
    element: createElement(OrganisationLimitsUpdatedEmailTemplate, {
      ...common,
      organisationName: 'Canary Organisation',
    }),
    forkText: ['support@0xmetalabs.com'],
  },
  {
    name: 'access-auth-2fa',
    element: createElement(AccessAuth2FAEmailTemplate, {
      ...common,
      documentTitle: 'Canary',
      code: '123456',
      userEmail: 'user@example.com',
      userName: 'Canary User',
      expiresInMinutes: 10,
    }),
    forkText: [],
  },
  {
    name: 'admin-user-created',
    element: createElement(AdminUserCreatedTemplate, { ...common, resetPasswordLink: `${forkUrl}/reset` }),
    forkText: ['Welcome to 0xDocHub!', 'mailto:support@0xmetalabs.com'],
  },
  {
    name: 'confirm-email',
    element: createElement(ConfirmEmailTemplate, { ...common, confirmationLink: `${forkUrl}/confirm` }),
    forkText: ['Welcome to 0xMetaLabs!'],
  },
  {
    name: 'confirm-team-email',
    element: createElement(ConfirmTeamEmailTemplate, {
      ...common,
      baseUrl: forkUrl,
      teamName: 'Canary Team',
      teamUrl: 'canary',
      token: 'canary-token',
    }),
    forkText: ['on 0xMetaLabs'],
  },
  {
    name: 'document-cancel',
    element: createElement(DocumentCancelTemplate, { ...common, cancellationReason: 'Canary cancellation' }),
    forkText: [],
  },
  { name: 'document-completed', element: createElement(DocumentCompletedEmailTemplate, common), forkText: [forkUrl] },
  {
    name: 'document-created-from-direct-template',
    element: createElement(DocumentCreatedFromDirectTemplateEmailTemplate, common),
    forkText: [],
  },
  {
    name: 'document-invite',
    element: createElement(DocumentInviteEmailTemplate, {
      ...common,
      role: RecipientRole.SIGNER,
      organisationType: OrganisationType.PERSONAL,
    }),
    forkText: ['mailto:lucas@0xmetalabs.com', forkUrl],
  },
  { name: 'document-pending', element: createElement(DocumentPendingEmailTemplate, common), forkText: [] },
  {
    name: 'document-recipient-signed',
    element: createElement(DocumentRecipientSignedEmailTemplate, { ...common, recipientName: '' }),
    forkText: ['lucas@0xmetalabs.com'],
  },
  {
    name: 'document-rejected',
    element: createElement(DocumentRejectedEmail, {
      ...common,
      recipientName: 'Canary Signer',
      documentName: 'Canary Document',
      documentUrl: `${forkUrl}/document`,
      rejectionReason: 'Canary rejection',
    }),
    forkText: [],
  },
  {
    name: 'document-rejection-confirmed',
    element: createElement(DocumentRejectionConfirmedEmail, {
      ...common,
      recipientName: 'Canary Signer',
      documentName: 'Canary Document',
      documentOwnerName: 'Canary Owner',
      reason: 'Canary rejection',
    }),
    forkText: [],
  },
  {
    name: 'document-reminder',
    element: createElement(DocumentReminderEmailTemplate, {
      ...common,
      recipientName: 'Canary Signer',
      documentName: 'Canary Document',
      signDocumentLink: forkUrl,
      role: RecipientRole.SIGNER,
      customBody: 'Canary reminder body',
    }),
    forkText: [],
  },
  {
    name: 'document-self-signed',
    element: createElement(DocumentSelfSignedEmailTemplate, { ...common, documentName: 'Canary Document' }),
    forkText: [`${forkUrl}/pricing`],
  },
  { name: 'document-super-delete', element: createElement(DocumentSuperDeleteEmailTemplate, common), forkText: [] },
  { name: 'forgot-password', element: createElement(ForgotPasswordTemplate, common), forkText: [forkUrl] },
  {
    name: 'organisation-account-link-confirmation',
    element: createElement(OrganisationAccountLinkConfirmationTemplate, {
      ...common,
      type: 'link',
      confirmationLink: `${forkUrl}/confirm`,
      organisationName: 'Canary Organisation',
    }),
    forkText: ['Link your 0xMetaLabs account'],
  },
  {
    name: 'organisation-invite',
    element: createElement(OrganisationInviteEmailTemplate, {
      ...common,
      baseUrl: forkUrl,
      senderName: 'Canary Inviter',
      organisationName: 'Canary Organisation',
      token: 'canary-token',
    }),
    forkText: ['on 0xMetaLabs'],
  },
  {
    name: 'organisation-join',
    element: createElement(OrganisationJoinEmailTemplate, {
      ...common,
      baseUrl: forkUrl,
      memberName: '',
      memberEmail: 'johndoe@0xmetalabs.com',
      organisationName: 'Canary Organisation',
      organisationUrl: 'canary',
    }),
    forkText: ['johndoe@0xmetalabs.com', 'on 0xMetaLabs'],
  },
  {
    name: 'organisation-leave',
    element: createElement(OrganisationLeaveEmailTemplate, {
      ...common,
      baseUrl: forkUrl,
      memberName: '',
      memberEmail: 'johndoe@0xmetalabs.com',
      organisationName: 'Canary Organisation',
      organisationUrl: 'canary',
    }),
    forkText: ['johndoe@0xmetalabs.com', 'on 0xMetaLabs'],
  },
  { name: 'recipient-expired', element: createElement(RecipientExpiredTemplate, common), forkText: [forkUrl] },
  {
    name: 'recipient-removed-by-admin',
    element: createElement(RecipientRemovedByAdminEmailTemplate, { ...common, audience: 'owner' }),
    forkText: ['lucas@0xmetalabs.com'],
  },
  {
    name: 'recipient-removed-from-document',
    element: createElement(RecipientRemovedFromDocumentTemplate, common),
    forkText: [],
  },
  {
    name: 'reset-password',
    element: createElement(ResetPasswordTemplate, common),
    forkText: ['mailto:hi@0xmetalabs.com', 'mailto:lucas@0xmetalabs.com'],
  },
  {
    name: 'team-delete',
    element: createElement(TeamDeleteEmailTemplate, { ...common, baseUrl: forkUrl, teamUrl: 'canary' }),
    forkText: ['dochub.ngx.0xmetalabs.com'],
  },
  {
    name: 'team-email-removed',
    element: createElement(TeamEmailRemovedTemplate, {
      ...common,
      baseUrl: forkUrl,
      teamEmail: 'example@0xmetalabs.com',
      teamName: 'Canary Team',
      teamUrl: 'canary',
    }),
    forkText: ['example@0xmetalabs.com', 'on 0xMetaLabs'],
  },
];

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

const elements = (node: Node): Element[] => {
  const children = 'childNodes' in node ? node.childNodes.flatMap(elements) : [];
  return 'tagName' in node ? [node, ...children] : children;
};
const attribute = (node: Element, name: string) => node.attrs.find((attr) => attr.name === name)?.value;
const text = (node: Node): string =>
  'value' in node ? node.value : 'childNodes' in node ? node.childNodes.map(text).join('') : '';
const styles = (node: Element) =>
  Object.fromEntries(
    (attribute(node, 'style') ?? '')
      .split(';')
      .filter(Boolean)
      .map((entry) => {
        const [property, ...value] = entry.split(':');
        return [property.trim(), value.join(':').trim()];
      }),
  );
const hex = (color: string) => colord(color).toHex();

const palettes: { name: string; colors: EmailBrandingColors }[] = [
  {
    name: 'light',
    colors: {
      ...DEFAULT_BRAND_COLORS,
      background: '#fffdf7',
      foreground: '#172554',
      muted: '#fef3c7',
      mutedForeground: '#475569',
      primary: '#1d4ed8',
      primaryForeground: '#ffffff',
      border: '#d4a373',
      destructive: '#b91c1c',
    },
  },
  {
    name: 'dark',
    colors: {
      ...DEFAULT_BRAND_COLORS,
      background: '#111827',
      foreground: '#f8fafc',
      muted: '#1f2937',
      mutedForeground: '#cbd5e1',
      primary: '#93c5fd',
      primaryForeground: '#111827',
      border: '#4b5563',
      destructive: '#fca5a5',
    },
  },
];
const branding: BrandingSettings = {
  brandingEnabled: true,
  brandingUrl: websiteUrl,
  brandingLogo: logoUrl,
  brandingCompanyDetails: 'Canary Company\nCanary Address',
  brandingHidePoweredBy: false,
};

const luminance = (color: string) => {
  const { r, g, b } = colord(color).toRgb();
  const linear = [r, g, b]
    .map((value) => value / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};

// Follow actual rendered inline inheritance, rather than testing source class names.
const verifyPalette = (html: string, colors: EmailBrandingColors) => {
  const document = parse(html);
  const body = elements(document).find((node) => node.tagName === 'body');
  expect(body).toBeDefined();
  if (!body) {
    return;
  }
  const backgrounds = elements(body)
    .map(styles)
    .map((style) => style['background-color'])
    .filter(Boolean)
    .map(hex);
  expect(backgrounds).toContain(colors.background);
  expect(backgrounds.every((color) => [colors.background, colors.muted, colors.primary].includes(color))).toBe(true);
  const borders = elements(body)
    .map(styles)
    .map((style) => style['border-color'])
    .filter(Boolean)
    .map(hex);
  expect(borders).toContain(colors.border);

  let visibleTextCount = 0;
  const visit = (node: Node, foreground = '#000000', background = '#ffffff') => {
    if ('tagName' in node) {
      const style = styles(node);
      if (style.display === 'none') {
        return;
      }
      foreground = style.color ?? foreground;
      background = style['background-color'] ?? background;
    }
    if ('value' in node && node.value.trim()) {
      visibleTextCount++;
      expect(Object.values(colors).map(hex), node.value).toContain(hex(foreground));
      const ratio =
        (Math.max(luminance(foreground), luminance(background)) + 0.05) /
        (Math.min(luminance(foreground), luminance(background)) + 0.05);
      expect(ratio, `${node.value.trim()}: ${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
    }
    if ('childNodes' in node) {
      node.childNodes.forEach((child) => visit(child, foreground, background));
    }
  };
  visit(body);
  expect(visibleTextCount).toBeGreaterThan(0);
};

const renderTemplate = (element: React.ReactElement, settings?: BrandingSettings) =>
  renderWithI18N(element, { i18n, branding: settings });

describe('0xDocHub rendered email regression', () => {
  describe.each(templates)('$name', ({ name, element, forkText }) => {
    it('preserves fork names, contacts, footer and every sub-path asset', async () => {
      const html = await renderTemplate(element);
      const nodes = elements(parse(html));
      const images = nodes.filter((node) => node.tagName === 'img');
      if (name !== 'bulk-send-complete') {
        expect(images.some((node) => attribute(node, 'src') === `${assetBaseUrl}/static/logo.png`)).toBe(true);
      }
      for (const image of images) {
        expect(attribute(image, 'src')).toMatch(/^https:\/\/release\.example\/ESign\/static\//);
      }
      expect(html).toContain('0xMetaLabs, Inc.');
      expect(html).toContain('INDIA - UAE - USA');
      expect(html).not.toContain('documen.so');
      expect(html).not.toContain('documenso.com');
      for (const value of forkText) {
        expect(html).toContain(value);
      }
    });

    it.each(palettes)('renders readable $name tenant colors, including inherited text', async ({ colors }) => {
      verifyPalette(await renderTemplate(element, { ...branding, brandingColors: colors }), colors);
    });

    it.each([
      'https://tenant.example/company',
      'http://tenant.example/company',
    ])('links the custom logo and Brand Website footer to safe %s', async (url) => {
      const html = await renderTemplate(element, { ...branding, brandingUrl: url });
      const nodes = elements(parse(html));
      const links = nodes.filter((node) => node.tagName === 'a' && attribute(node, 'href') === url);
      const footerLink = links.find((node) => text(node) === url);
      expect(footerLink).toBeDefined();
      expect(footerLink && attribute(footerLink, 'target')).toBe('_blank');
      expect(html).toContain('Canary Company<br/>Canary Address');
      expect(html).not.toContain('0xMetaLabs, Inc.');
      if (name !== 'admin-user-created' && name !== 'bulk-send-complete') {
        const logoLink = links.find((node) =>
          elements(node).some((child) => child.tagName === 'img' && attribute(child, 'src') === logoUrl),
        );
        expect(logoLink).toBeDefined();
        expect(logoLink && attribute(logoLink, 'target')).toBe('_blank');
        expect(html).not.toContain(`${assetBaseUrl}/static/logo.png`);
      }
    });

    it('rejects unsafe Brand Website without removing the custom logo', async () => {
      const html = await renderTemplate(element, { ...branding, brandingUrl: 'javascript:alert(1)' });
      const nodes = elements(parse(html));
      expect(html).not.toContain('javascript:');
      if (name !== 'admin-user-created' && name !== 'bulk-send-complete') {
        expect(nodes.some((node) => node.tagName === 'img' && attribute(node, 'src') === logoUrl)).toBe(true);
        expect(
          nodes.some(
            (node) => node.tagName === 'a' && elements(node).some((child) => attribute(child, 'src') === logoUrl),
          ),
        ).toBe(false);
      }
    });

    it('retains Brand Website without a logo and ignores disabled branding', async () => {
      const html = await renderTemplate(element, { ...branding, brandingLogo: '' });
      const links = elements(parse(html)).filter(
        (node) => node.tagName === 'a' && attribute(node, 'href') === websiteUrl,
      );
      expect(links).toHaveLength(1);
      expect(text(links[0])).toBe(websiteUrl);
      if (name !== 'bulk-send-complete') {
        expect(html).toContain(`${assetBaseUrl}/static/logo.png`);
      }
      const disabled = await renderTemplate(element, { ...branding, brandingEnabled: false });
      expect(disabled).not.toContain(websiteUrl);
      expect(disabled).not.toContain(logoUrl);
      expect(disabled).not.toContain('Canary Company');
      expect(disabled).toContain('0xMetaLabs, Inc.');
    });
  });

  it.each([
    'invite',
    'reminder',
    'completed',
  ])('retains %s sender reporting even when powered-by branding is hidden', async (template) => {
    const element =
      template === 'invite'
        ? createElement(DocumentInviteEmailTemplate, { ...common, role: RecipientRole.SIGNER, reportUrl })
        : template === 'reminder'
          ? createElement(DocumentReminderEmailTemplate, {
              ...common,
              recipientName: 'Canary Signer',
              documentName: 'Canary Document',
              signDocumentLink: forkUrl,
              role: RecipientRole.SIGNER,
              reportUrl,
            })
          : createElement(DocumentCompletedEmailTemplate, { ...common, reportUrl });
    for (const hidden of [false, true]) {
      const html = await renderTemplate(element, { ...branding, brandingHidePoweredBy: hidden });
      const nodes = elements(parse(html));
      const report = nodes.find((node) => node.tagName === 'a' && attribute(node, 'href') === reportUrl);
      expect(report && text(report)).toBe('Click here to report the sender');
      expect(text(parse(html))).toContain("Never sign a document you don't recognize or weren't expecting.");
      expect(html.includes('0xDocHub by 0xMetaLabs')).toBe(!hidden);
    }
  });

  it('interpolates a personal inviter email in its mailto link', async () => {
    const html = await renderTemplate(
      createElement(DocumentInviteEmailTemplate, {
        ...common,
        role: RecipientRole.SIGNER,
        organisationType: OrganisationType.PERSONAL,
        inviterEmail: 'inviter+canary@example.com',
      }),
    );
    expect(html).toContain('href="mailto:inviter+canary@example.com"');
    expect(html).not.toContain('mailto:{inviterEmail}');
  });

  it.each([
    'RESET',
    'UPDATE',
  ] as const)('preserves %s password notifications and local support links', async (source) => {
    const html = await renderTemplate(createElement(ResetPasswordTemplate, { source, assetBaseUrl }));
    expect(html).toContain(`${assetBaseUrl}/static/logo.png`);
    expect(html).toContain('mailto:hi@0xmetalabs.com');
    expect(html).not.toContain('documenso.com');
    const content = text(parse(html));
    expect(content).toContain(source === 'RESET' ? 'changed your password as you asked' : 'account security settings');
    expect(content).not.toContain(
      source === 'RESET' ? 'account security settings' : 'changed your password as you asked',
    );
    expect(content).toContain(
      source === 'RESET' ? "Didn't request a password change?" : 'reset your password immediately',
    );
  });
});
