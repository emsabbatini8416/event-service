import { z } from 'zod';
import { EventStatus } from '../types/event.types';
import { AppError } from '../types/error.types';
import { isInFuture, isValidISODate } from '../utils/date.utils';

const isoDateSchema = z.string().refine(isValidISODate, {
  message: 'Must be a valid ISO 8601 datetime'
});

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title cannot exceed 200 characters'),
  startAt: isoDateSchema.refine(isInFuture, {
    message: 'Must be in the future'
  }),
  endAt: isoDateSchema,
  location: z.string().min(1, 'Location cannot be empty'),
  status: z.nativeEnum(EventStatus).optional().default(EventStatus.DRAFT),
  internalNotes: z.string().optional(),
  createdBy: z.string().email().optional()
}).refine(
  (data) => new Date(data.startAt) < new Date(data.endAt),
  {
    message: 'startAt must be before endAt',
    path: ['endAt']
  }
);

export const updateEventSchema = z.object({
  status: z.nativeEnum(EventStatus).optional(),
  internalNotes: z.string().optional()
}).refine(
  (data) => data.status !== undefined || data.internalNotes !== undefined,
  {
    message: 'At least one field must be provided'
  }
);

export const queryParamsSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  locations: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim()) : undefined
  ),
  status: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim() as EventStatus) : undefined
  ),
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => {
    const num = val ? parseInt(val, 10) : 20;
    return Math.min(num, 100);
  })
});

export function validateStatusTransition(currentStatus: EventStatus, newStatus: EventStatus): void {
  const invalidTransitions: Record<EventStatus, EventStatus[]> = {
    [EventStatus.DRAFT]: [],
    [EventStatus.PUBLISHED]: [EventStatus.DRAFT],
    [EventStatus.CANCELLED]: [EventStatus.DRAFT, EventStatus.PUBLISHED]
  };

  const forbidden = invalidTransitions[currentStatus];
  if (forbidden.includes(newStatus)) {
    throw new AppError(
      'INVALID_TRANSITION',
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      400,
      [{ field: 'status', message: `Cannot move from ${currentStatus} back to ${newStatus}` }]
    );
  }
}

