
import { Hono } from 'hono';
import { QuickReplyController } from '../controllers/quick-reply.controller';
import { authMiddleware } from '../middlewares';

const quickReply = new Hono();

// Apply authentication to all routes
quickReply.use('/*', authMiddleware);

quickReply.get('/', QuickReplyController.index);
quickReply.post('/', QuickReplyController.create);
quickReply.put('/:id', QuickReplyController.update);
quickReply.delete('/:id', QuickReplyController.delete);

export default quickReply;
