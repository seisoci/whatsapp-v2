import { Hono } from 'hono';
import { ContactController } from '../controllers/contact.controller';
import { authMiddleware } from '../middlewares';

const contactRouter = new Hono();

// All routes require authentication
contactRouter.use('*', authMiddleware);

contactRouter.get('/', ContactController.index);
contactRouter.post('/', ContactController.store);
contactRouter.get('/:id', ContactController.show);
contactRouter.put('/:id', ContactController.update);
contactRouter.delete('/:id', ContactController.destroy);

export default contactRouter;
