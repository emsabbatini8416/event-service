import express, { Express, Request, Response, NextFunction } from 'express';
import { InMemoryEventRepository } from './repositories/event.repository';
import { EventService } from './services/event.service';
import { NotificationService } from './services/notification.service';
import { CacheService } from './services/cache.service';
import { SummaryService } from './services/summary.service';
import { EventController } from './controllers/event.controller';
import { createEventRoutes } from './routes/event.routes';
import { createHealthRoutes } from './routes/health.routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { logger } from './utils/logger';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.use(requestIdMiddleware);

  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip
    }, req.requestId);
    next();
  });

  const eventRepository = new InMemoryEventRepository();
  const notificationService = new NotificationService();
  const eventService = new EventService(eventRepository, notificationService);
  const cacheService = new CacheService();
  const summaryService = new SummaryService();

  const eventController = new EventController(eventService, cacheService, summaryService);

  app.use('/api/v1', createEventRoutes(eventController));
  app.use('/api/v1', createHealthRoutes());

  app.use('/api', createEventRoutes(eventController));
  app.use('/api', createHealthRoutes());

  app.use(errorMiddleware);

  return app;
}

export { InMemoryEventRepository };
