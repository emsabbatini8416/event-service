import { INotificationService } from './notification.service';
import { logger } from '../utils/logger';

export class SNSNotificationService implements INotificationService {
  constructor() {
  }

  async notifyEventCreated(title: string): Promise<void> {
    logger.info(`[NOTIFICATION] New event created: ${title} (SNS implementation ready but commented)`);
  }

  async notifyEventPublished(title: string): Promise<void> {
    logger.info(`[NOTIFICATION] Event published: ${title} (SNS implementation ready but commented)`);
  }

  async notifyEventCancelled(title: string): Promise<void> {
    logger.info(`[NOTIFICATION] Event cancelled: ${title} (SNS implementation ready but commented)`);
  }
}
