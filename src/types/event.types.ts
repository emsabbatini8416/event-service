export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CANCELLED = 'CANCELLED'
}

export interface Event {
  id: string;
  title: string;
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  location: string;
  status: EventStatus;
  internalNotes?: string;
  createdBy?: string;
  updatedAt: string; // ISO datetime
}

export interface PublicEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  status: EventStatus;
  isUpcoming: boolean;
}

export interface CreateEventDto {
  title: string;
  startAt: string;
  endAt: string;
  location: string;
  status?: EventStatus;
  internalNotes?: string;
  createdBy?: string;
}

export interface UpdateEventDto {
  status?: EventStatus;
  internalNotes?: string;
}

export interface EventQueryParams {
  dateFrom?: string;
  dateTo?: string;
  locations?: string[];
  status?: EventStatus[];
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  events: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

