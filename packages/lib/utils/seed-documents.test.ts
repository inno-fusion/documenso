import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  documentData: { create: vi.fn() },
  documentMeta: { create: vi.fn() },
  envelope: { create: vi.fn(), findFirstOrThrow: vi.fn() },
  recipient: { create: vi.fn() },
}));

vi.mock('@documenso/prisma', () => ({ prisma: db }));
vi.mock('../server-only/envelope/create-envelope', () => ({ createEnvelope: vi.fn() }));
vi.mock('../server-only/envelope/increment-id', () => ({
  incrementDocumentId: vi.fn().mockResolvedValue({ formattedDocumentId: 'document_1' }),
}));
vi.mock('@documenso/prisma/seed/teams', () => ({ seedTeam: vi.fn() }));
vi.mock('@documenso/prisma/seed/users', () => ({ seedUser: vi.fn() }));

import { seedDocuments } from '@documenso/prisma/seed/documents';
import { DocumentStatus, type User } from '@prisma/client';

const sender = { id: 1, email: 'sender@example.test', name: 'Sender' } as User;
const envelope = { id: 'envelope_1', envelopeItems: [{ id: 'item_1' }] };

describe('document batch fixture completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.documentData.create.mockResolvedValue({ id: 'data_1' });
    db.documentMeta.create.mockResolvedValue({ id: 'meta_1' });
    db.envelope.create.mockResolvedValue(envelope);
    db.envelope.findFirstOrThrow.mockResolvedValue(envelope);
  });

  it.each([
    DocumentStatus.DRAFT,
    DocumentStatus.PENDING,
    DocumentStatus.COMPLETED,
  ])('waits for %s recipient writes before resolving', async (type) => {
    let releaseWrite!: () => void;
    db.recipient.create.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseWrite = resolve;
        }),
    );
    let settled = false;
    const seeded = seedDocuments([{ sender, teamId: 1, recipients: ['recipient@example.test'], type }]).then(() => {
      settled = true;
    });

    await vi.waitFor(() => expect(db.recipient.create).toHaveBeenCalledOnce());
    expect(settled).toBe(false);
    releaseWrite();
    await seeded;
    expect(settled).toBe(true);
    expect(db.envelope.create).toHaveBeenCalledOnce();
  });
});
