import { prisma } from '@documenso/prisma';
import { expect, test } from '@playwright/test';
import { DocumentDistributionMethod } from '@prisma/client';

import { getEnvelopeEditorSettingsTrigger, openDocumentEnvelopeEditor } from '../fixtures/envelope-editor';
import { expectToastTextToBeVisible } from '../fixtures/generic';

const RECIPIENT_EVENTS = [
  'recipientSigningRequest',
  'recipientRemoved',
  'recipientSigned',
  'documentPending',
  'documentCompleted',
  'documentDeleted',
] as const;

const OWNER_EVENTS = ['ownerDocumentCompleted', 'ownerRecipientExpired', 'ownerDocumentCreated'] as const;

const EMAIL_CONTENT = {
  emailReplyTo: 'distribution-regression@example.com',
  subject: 'Distribution round trip',
  message: 'Preserve email content while distribution is disabled.',
};

const WARNING =
  'Email distribution needs to be enabled in the general settings tab to configure recipient email related settings.';

test('notification controls follow EMAIL -> NONE -> EMAIL without losing settings', async ({ page }) => {
  test.setTimeout(120_000);

  const surface = await openDocumentEnvelopeEditor(page);
  const claim = await prisma.organisationClaim.findFirstOrThrow({
    where: { organisation: { teams: { some: { id: surface.teamId } } } },
  });

  // Enable the sender control for this fixture so its assertions cannot be skipped.
  await prisma.organisationClaim.update({
    where: { id: claim.id },
    data: { flags: { allowLegacyEnvelopes: true, emailDomains: true } },
  });
  expect((await prisma.organisationClaim.findUniqueOrThrow({ where: { id: claim.id } })).flags).toMatchObject({
    emailDomains: true,
  });
  await page.reload();

  await getEnvelopeEditorSettingsTrigger(page).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Document Settings' })).toBeVisible();
  await expect(dialog.getByTestId('documentDistributionMethodSelectValue')).toHaveText('Email');

  // Keep exercising distribution behavior even if the notification tab was renamed.
  const notificationsTab = dialog.locator('nav button').nth(2);
  await expect.soft(notificationsTab).toHaveText('Notifications');
  await notificationsTab.click();

  const emailSender = dialog.locator('label:has-text("Email Sender")').locator('..').getByRole('combobox');
  const replyTo = dialog.locator('input[name="meta.emailReplyTo"]');
  const subject = dialog.locator('input[name="meta.subject"]');
  const message = dialog.locator('textarea[name="meta.message"]');
  const warning = dialog.getByRole('alert').filter({ hasText: WARNING });

  await expect(emailSender).toBeVisible();
  await expect(emailSender).toBeEnabled();
  await expect(emailSender).toHaveText('0xDocHub');
  await expect(replyTo).toBeEnabled();
  await expect(subject).toBeEnabled();
  await expect(message).toBeEnabled();
  await expect(warning).toHaveCount(0);
  await replyTo.fill(EMAIL_CONTENT.emailReplyTo);
  await subject.fill(EMAIL_CONTENT.subject);
  await message.fill(EMAIL_CONTENT.message);

  for (const event of RECIPIENT_EVENTS) {
    const checkbox = dialog.locator(`#${event}`);
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeEnabled();
    await expect(checkbox).toBeChecked();
  }
  await dialog.locator('#recipientSigningRequest').uncheck();

  await dialog.getByRole('button', { name: 'General', exact: true }).click();
  await dialog.getByTestId('documentDistributionMethodSelectValue').click();
  await page.getByRole('option', { name: 'None', exact: true }).click();
  await notificationsTab.click();

  await expect.soft(emailSender).toBeDisabled();
  await expect.soft(replyTo).toBeDisabled();
  await expect.soft(subject).toBeDisabled();
  await expect.soft(message).toBeDisabled();
  await expect(replyTo).toHaveValue(EMAIL_CONTENT.emailReplyTo);
  await expect(subject).toHaveValue(EMAIL_CONTENT.subject);
  await expect(message).toHaveValue(EMAIL_CONTENT.message);
  for (const event of RECIPIENT_EVENTS) {
    await expect.soft(dialog.locator(`#${event}`)).toHaveCount(0);
  }
  await expect.soft(warning).toBeVisible();

  for (const event of OWNER_EVENTS) {
    const checkbox = dialog.locator(`#${event}`);
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeEnabled();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  }

  await dialog.getByRole('button', { name: 'General', exact: true }).click();
  await dialog.getByTestId('documentDistributionMethodSelectValue').click();
  await page.getByRole('option', { name: 'Email', exact: true }).click();
  await notificationsTab.click();

  await expect(emailSender).toBeEnabled();
  await expect(replyTo).toBeEnabled();
  await expect(subject).toBeEnabled();
  await expect(message).toBeEnabled();
  await expect(replyTo).toHaveValue(EMAIL_CONTENT.emailReplyTo);
  await expect(subject).toHaveValue(EMAIL_CONTENT.subject);
  await expect(message).toHaveValue(EMAIL_CONTENT.message);
  await expect(warning).toHaveCount(0);
  for (const event of RECIPIENT_EVENTS) {
    const checkbox = dialog.locator(`#${event}`);
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeEnabled();
    await expect(checkbox).toHaveAttribute('aria-checked', String(event !== 'recipientSigningRequest'));
  }
  for (const event of OWNER_EVENTS) {
    await expect(dialog.locator(`#${event}`)).not.toBeChecked();
  }

  await dialog.getByRole('button', { name: 'Update', exact: true }).click();
  await expectToastTextToBeVisible(page, 'Envelope updated');
  const envelope = await prisma.envelope.findUniqueOrThrow({
    where: { id: surface.envelopeId },
    include: { documentMeta: true },
  });
  expect(envelope.documentMeta.distributionMethod).toBe(DocumentDistributionMethod.EMAIL);
  expect(envelope.documentMeta).toMatchObject(EMAIL_CONTENT);
  expect(envelope.documentMeta.emailId).toBeNull();
  expect(envelope.documentMeta.emailSettings).toMatchObject({
    recipientSigningRequest: false,
    recipientRemoved: true,
    recipientSigned: true,
    documentPending: true,
    documentCompleted: true,
    documentDeleted: true,
    ownerDocumentCompleted: false,
    ownerRecipientExpired: false,
    ownerDocumentCreated: false,
  });
});
