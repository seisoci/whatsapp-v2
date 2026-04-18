/**
 * Meilisearch Admin Routes
 */

import { Hono } from 'hono';
import { MeilisearchAdminController as Ctrl } from '../controllers/meilisearch-admin.controller';
import { authMiddleware } from '../middlewares';

const meili = new Hono();

meili.use('/*', authMiddleware);

// Global stats
meili.get('/stats', Ctrl.getStats);

// Global resync
meili.post('/resync-force', Ctrl.resyncForceAll);
meili.post('/resync-continue', Ctrl.resyncContinueAll);

// Per-index operations
meili.get('/indexes/:index/documents', Ctrl.getDocuments);
meili.delete('/indexes/:index/documents', Ctrl.clearIndexDocuments);
meili.post('/indexes/:index/resync-force', Ctrl.resyncForceIndex);
meili.post('/indexes/:index/resync-continue', Ctrl.resyncContinueIndex);

export default meili;
