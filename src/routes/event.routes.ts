import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

export function createEventRoutes(controller: EventController): Router {
  const router = Router();

  router.post('/events', authMiddleware, asyncHandler(controller.createEvent));
  router.patch('/events/:id', authMiddleware, asyncHandler(controller.updateEvent));
  router.get('/events', authMiddleware, asyncHandler(controller.getEvents));

  router.get('/public/events', asyncHandler(controller.getPublicEvents));
  router.get('/public/events/:id/summary', asyncHandler(controller.streamEventSummary));

  return router;
}
