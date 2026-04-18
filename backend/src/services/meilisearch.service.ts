/**
 * Meilisearch Service
 * Manages Meilisearch connection, index configuration, and document sync.
 *
 * Indexes:
 *   - contacts  : waId (no hp), profileName, businessName, phoneNumberId
 *   - messages  : textBody, mediaCaption, contactId, phoneNumber, profileName, phoneNumberId
 */

import { Meilisearch, MatchingStrategies, type Index } from 'meilisearch';

const host = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const apiKey = process.env.MEILISEARCH_API_KEY || '';

export const meiliClient = new Meilisearch({ host, apiKey });

// ---------- index names ----------
export const CONTACTS_INDEX = 'contacts';
export const MESSAGES_INDEX = 'messages';

// ---------- document types ----------
export interface MeiliContact {
  id: string;
  waId: string;
  phoneNumber: string;
  profileName: string | null;
  businessName: string | null;
  phoneNumberId: string;
  isArchived: boolean;
  unreadCount: number;
  lastMessageAt: number | null; // Unix timestamp (ms) — Meilisearch sorts numbers faster
  createdAt: number;
}

export interface MeiliMessage {
  id: string;
  contactId: string;
  phoneNumberId: string;
  /** Denormalized from contact for display in search results */
  contactName: string | null;
  contactPhone: string;
  direction: 'incoming' | 'outgoing';
  messageType: string;
  textBody: string | null;
  mediaCaption: string | null;
  timestamp: number; // Unix timestamp (ms)
}

// ---------- index setup ----------

/**
 * Initialise both indexes with correct searchable / filterable attributes.
 * Safe to call multiple times — Meilisearch is idempotent for these settings.
 */
export async function setupMeilisearchIndexes(): Promise<void> {
  // --- contacts ---
  const contactsIndex: Index = meiliClient.index(CONTACTS_INDEX);
  await contactsIndex.updateSettings({
    searchableAttributes: ['profileName', 'businessName', 'waId', 'phoneNumber'],
    filterableAttributes: ['phoneNumberId', 'isArchived'],
    sortableAttributes: ['lastMessageAt', 'createdAt', 'unreadCount'],
    displayedAttributes: [
      'id', 'waId', 'phoneNumber', 'profileName', 'businessName',
      'phoneNumberId', 'isArchived', 'unreadCount', 'lastMessageAt', 'createdAt',
    ],
  });

  // --- messages ---
  const messagesIndex: Index = meiliClient.index(MESSAGES_INDEX);
  await messagesIndex.updateSettings({
    searchableAttributes: ['textBody', 'contactName', 'contactPhone'],
    filterableAttributes: ['phoneNumberId', 'contactId', 'direction', 'messageType'],
    sortableAttributes: ['timestamp'],
    displayedAttributes: [
      'id', 'contactId', 'phoneNumberId', 'contactName', 'contactPhone',
      'direction', 'messageType', 'textBody', 'mediaCaption', 'timestamp',
    ],
  });

  console.log('[Meilisearch] Indexes configured');
}

// ---------- sync helpers ----------

export async function indexContact(contact: MeiliContact): Promise<void> {
  await meiliClient.index(CONTACTS_INDEX).addDocuments([contact], { primaryKey: 'id' });
}

export async function indexContacts(contacts: MeiliContact[]): Promise<void> {
  if (contacts.length === 0) return;
  await meiliClient.index(CONTACTS_INDEX).addDocuments(contacts, { primaryKey: 'id' });
}

export async function deleteContactFromIndex(contactId: string): Promise<void> {
  await meiliClient.index(CONTACTS_INDEX).deleteDocument(contactId);
}

export async function indexMessage(message: MeiliMessage): Promise<void> {
  // Only index text messages with non-empty body
  if (message.messageType !== 'text' || !message.textBody) return;
  await meiliClient.index(MESSAGES_INDEX).addDocuments([message], { primaryKey: 'id' });
}

export async function indexMessages(messages: MeiliMessage[]): Promise<void> {
  const searchable = messages.filter((m) => m.messageType === 'text' && m.textBody);
  if (searchable.length === 0) return;
  await meiliClient.index(MESSAGES_INDEX).addDocuments(searchable, { primaryKey: 'id' });
}

export async function deleteMessageFromIndex(messageId: string): Promise<void> {
  await meiliClient.index(MESSAGES_INDEX).deleteDocument(messageId);
}

// ---------- admin: stats & bulk ops ----------

export interface IndexStats {
  name: string;
  numberOfDocuments: number;
  isIndexing: boolean;
}

export async function getIndexStats(): Promise<IndexStats[]> {
  const [contactsStats, messagesStats] = await Promise.all([
    meiliClient.index(CONTACTS_INDEX).getStats(),
    meiliClient.index(MESSAGES_INDEX).getStats(),
  ]);
  return [
    { name: CONTACTS_INDEX, numberOfDocuments: contactsStats.numberOfDocuments, isIndexing: contactsStats.isIndexing },
    { name: MESSAGES_INDEX, numberOfDocuments: messagesStats.numberOfDocuments, isIndexing: messagesStats.isIndexing },
  ];
}

export async function getIndexDocuments(indexName: string, offset = 0, limit = 20): Promise<{ results: any[]; total: number }> {
  const result = await meiliClient.index(indexName).getDocuments({ offset, limit });
  return { results: result.results, total: result.total };
}

export async function clearIndex(indexName: string): Promise<void> {
  await meiliClient.index(indexName).deleteAllDocuments();
}

// ---------- search ----------

export interface SearchOptions {
  phoneNumberId: string;
  query: string;
  limit?: number;
}

export interface SearchResult {
  contacts: MeiliContact[];
  messages: MeiliMessage[];
}

export async function searchAll(opts: SearchOptions): Promise<SearchResult> {
  const { phoneNumberId, query, limit = 20 } = opts;

  // Use 'all' strategy so ALL words must match (AND logic).
  // Default 'last' is OR-like — causes false positives when one common word (e.g. "invoice")
  // exists in many unrelated messages.
  const [contactResults, messageResults] = await Promise.all([
    meiliClient.index(CONTACTS_INDEX).search<MeiliContact>(query, {
      filter: `phoneNumberId = "${phoneNumberId}"`,
      limit,
      matchingStrategy: MatchingStrategies.ALL,
    }),
    meiliClient.index(MESSAGES_INDEX).search<MeiliMessage>(query, {
      filter: `phoneNumberId = "${phoneNumberId}"`,
      limit,
      sort: ['timestamp:desc'],
      matchingStrategy: MatchingStrategies.ALL,
    }),
  ]);

  return {
    contacts: contactResults.hits,
    messages: messageResults.hits,
  };
}
