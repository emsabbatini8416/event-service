import { v4 as uuidv4 } from 'uuid';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventQueryParams,
  PaginatedResponse,
  PublicEvent,
  EventStatus
} from '../types/event.types';
import { AppError } from '../types/error.types';
import { IEventRepository } from '../repositories/event.repository';
import { INotificationService } from './notification.service';
import { validateStatusTransition } from '../validators/event.validator';
import { isUpcoming } from '../utils/date.utils';

export class EventService {
  constructor(
    private repository: IEventRepository,
    private notificationService: INotificationService
  ) {}

  async createEvent(dto: CreateEventDto): Promise<Event> {
    const now = new Date().toISOString();
    
    const event: Event = {
      id: uuidv4(),
      title: dto.title,
      startAt: dto.startAt,
      endAt: dto.endAt,
      location: dto.location,
      status: dto.status || EventStatus.DRAFT,
      internalNotes: dto.internalNotes,
      createdBy: dto.createdBy,
      updatedAt: now
    };

    const created = await this.repository.create(event);

    this.notificationService.notifyEventCreated(created.title).catch(err => {
      console.error('Failed to send notification:', err);
    });

    return created;
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.repository.findById(id);
    
    if (!event) {
      throw new AppError('NOT_FOUND', 'Event not found', 404);
    }

    if (dto.status && dto.status !== event.status) {
      validateStatusTransition(event.status, dto.status);
    }

    const updates: Partial<Event> = {
      updatedAt: new Date().toISOString()
    };

    if (dto.status !== undefined) {
      updates.status = dto.status;
    }

    if (dto.internalNotes !== undefined) {
      updates.internalNotes = dto.internalNotes;
    }

    const updated = await this.repository.update(id, updates);

    if (!updated) {
      throw new AppError('NOT_FOUND', 'Event not found', 404);
    }

    if (dto.status && dto.status !== event.status) {
      if (event.status === EventStatus.DRAFT && dto.status === EventStatus.PUBLISHED) {
        this.notificationService.notifyEventPublished(updated.title).catch(err => {
          console.error('Failed to send notification:', err);
        });
      } else if (dto.status === EventStatus.CANCELLED) {
        this.notificationService.notifyEventCancelled(updated.title).catch(err => {
          console.error('Failed to send notification:', err);
        });
      }
    }

    return updated;
  }

  async getEvents(params: EventQueryParams): Promise<PaginatedResponse<Event>> {
    const events = await this.repository.findAll(params);
    const total = await this.repository.count(params);
    
    const page = params.page || 1;
    const limit = params.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async getPublicEvents(params: EventQueryParams): Promise<PaginatedResponse<PublicEvent>> {
    const publicParams = {
      ...params,
      status: [EventStatus.PUBLISHED, EventStatus.CANCELLED]
    };

    const events = await this.repository.findAll(publicParams);
    const total = await this.repository.count(publicParams);
    
    const page = params.page || 1;
    const limit = params.limit || 20;
    const totalPages = Math.ceil(total / limit);

    const publicEvents = events.map(this.toPublicEvent);

    return {
      events: publicEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async getEventById(id: string): Promise<Event | null> {
    return this.repository.findById(id);
  }

  async getPublicEventById(id: string): Promise<PublicEvent | null> {
    const event = await this.repository.findById(id);
    
    if (!event || (event.status !== EventStatus.PUBLISHED && event.status !== EventStatus.CANCELLED)) {
      return null;
    }

    return this.toPublicEvent(event);
  }

  private toPublicEvent(event: Event): PublicEvent {
    return {
      id: event.id,
      title: event.title,
      startAt: event.startAt,
      endAt: event.endAt,
      location: event.location,
      status: event.status,
      isUpcoming: isUpcoming(event.startAt)
    };
  }
}
