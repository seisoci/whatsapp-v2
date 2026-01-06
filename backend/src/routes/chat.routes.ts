/**
 * Chat Routes
 * Endpoints for chat interface
 */

import { Hono } from 'hono';
import { ChatController } from '../controllers/chat.controller';
import { MessageController } from '../controllers/message.controller';
import { ContactTagController } from '../controllers/contact-tag.controller';
import { authMiddleware } from '../middlewares';

const chat = new Hono();

// Apply authentication to all routes
chat.use('/*', authMiddleware);

// Contact endpoints
chat.get('/contacts', ChatController.getContacts);
chat.get('/contacts/:id', ChatController.getContact);
chat.put('/contacts/:id/read', ChatController.markConversationAsRead);
chat.delete('/contacts/:id', ChatController.deleteContact);

// Message endpoints
chat.get('/messages', MessageController.getMessages);
chat.post('/messages', MessageController.sendMessage);
chat.put('/messages/:id/read', MessageController.markAsRead);

// Contact Tag endpoints
chat.post('/contacts/:contactId/tags', ContactTagController.addTag);
chat.delete('/contacts/:contactId/tags/:tagId', ContactTagController.removeTag);

export default chat;
