import { Event, EventQueryParams } from '../types/event.types';
import { isDateInRange } from '../utils/date.utils';

export interface IEventRepository {
  create(event: Event): Promise<Event>;
  update(id: string, updates: Partial<Event>): Promise<Event | null>;
  findById(id: string): Promise<Event | null>;
  findAll(params: EventQueryParams): Promise<Event[]>;
  count(params: EventQueryParams): Promise<number>;
}

export class InMemoryEventRepository implements IEventRepository {
  private events: Map<string, Event> = new Map();

  async create(event: Event): Promise<Event> {
    this.events.set(event.id, event);
    return event;
  }

  async update(id: string, updates: Partial<Event>): Promise<Event | null> {
    const event = this.events.get(id);
    if (!event) return null;

    const updatedEvent = { ...event, ...updates };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async findById(id: string): Promise<Event | null> {
    return this.events.get(id) || null;
  }

  async findAll(params: EventQueryParams): Promise<Event[]> {
    let filtered = Array.from(this.events.values());

    if (params.dateFrom || params.dateTo) {
      filtered = filtered.filter(event =>
        isDateInRange(event.startAt, params.dateFrom, params.dateTo)
      );
    }

    if (params.locations && params.locations.length > 0) {
      filtered = filtered.filter(event =>
        params.locations!.some(loc =>
          event.location.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    if (params.status && params.status.length > 0) {
      filtered = filtered.filter(event =>
        params.status!.includes(event.status)
      );
    }

    filtered.sort((a, b) => 
      new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );

    const page = params.page || 1;
    const limit = params.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return filtered.slice(startIndex, endIndex);
  }

  async count(params: EventQueryParams): Promise<number> {
    let filtered = Array.from(this.events.values());

    if (params.dateFrom || params.dateTo) {
      filtered = filtered.filter(event =>
        isDateInRange(event.startAt, params.dateFrom, params.dateTo)
      );
    }

    if (params.locations && params.locations.length > 0) {
      filtered = filtered.filter(event =>
        params.locations!.some(loc =>
          event.location.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    if (params.status && params.status.length > 0) {
      filtered = filtered.filter(event =>
        params.status!.includes(event.status)
      );
    }

    return filtered.length;
  }

  clear(): void {
    this.events.clear();
  }
}
