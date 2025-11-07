import { logger } from '../utils/logger';

export interface INotificationService {
  notifyEventCreated(title: string): Promise<void>;
  notifyEventPublished(title: string): Promise<void>;
  notifyEventCancelled(title: string): Promise<void>;
}

export class NotificationService implements INotificationService {
  async notifyEventCreated(title: string): Promise<void> {
    await this.simulateAsyncOperation();
    logger.info(`[NOTIFICATION] New event created: ${title}`);
  }

  async notifyEventPublished(title: string): Promise<void> {
    await this.simulateAsyncOperation();
    logger.info(`[NOTIFICATION] Event published: ${title}`);
  }

  async notifyEventCancelled(title: string): Promise<void> {
    await this.simulateAsyncOperation();
    logger.info(`[NOTIFICATION] Event cancelled: ${title}`);
  }

  private simulateAsyncOperation(): Promise<void> {
    return new Promise(resolve => {
      setImmediate(() => resolve());
    });
  }
}
