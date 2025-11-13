import request from 'supertest';
import { createApp } from '../app';
import { Express } from 'express';
import { config } from '../config';

describe('Event Service E2E Tests', () => {
  let app: Express;
  const authToken = config.adminToken;

  beforeEach(() => {
    app = createApp();
  });

  describe('Authentication', () => {
    it('should return 401 when creating event without auth header', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({
          title: 'Test Event',
          startAt: '2026-12-01T10:00:00Z',
          endAt: '2026-12-01T12:00:00Z',
          location: 'Test Location'
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when querying events without auth header', async () => {
      const response = await request(app).get('/api/events');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 when accessing public endpoint without auth', async () => {
      const response = await request(app).get('/api/public/events');

      expect(response.status).toBe(200);
    });
  });

  describe('Event Creation', () => {
    it('should create an event with valid data', async () => {
      const eventData = {
        title: 'Go Live',
        startAt: '2026-09-01T10:00:00Z',
        endAt: '2026-09-01T12:00:00Z',
        location: 'São Paulo',
        status: 'PUBLISHED',
        internalNotes: 'VIP list pending',
        createdBy: 'cto@example.com'
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: eventData.title,
        startAt: eventData.startAt,
        endAt: eventData.endAt,
        location: eventData.location,
        status: eventData.status,
        internalNotes: eventData.internalNotes,
        createdBy: eventData.createdBy
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 400 when title is empty', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          startAt: '2025-12-01T10:00:00Z',
          endAt: '2025-12-01T12:00:00Z',
          location: 'Test Location'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when title exceeds 200 characters', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'a'.repeat(201),
          startAt: '2026-12-01T10:00:00Z',
          endAt: '2026-12-01T12:00:00Z',
          location: 'Test Location'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when startAt is after endAt', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Event',
          startAt: '2026-12-01T12:00:00Z',
          endAt: '2026-12-01T10:00:00Z',
          location: 'Test Location'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when startAt is in the past', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Event',
          startAt: '2020-01-01T10:00:00Z',
          endAt: '2020-01-01T12:00:00Z',
          location: 'Test Location'
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'startAt',
            message: 'Must be in the future'
          })
        ])
      );
    });

    it('should return 400 when location is empty', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Event',
          startAt: '2025-12-01T10:00:00Z',
          endAt: '2025-12-01T12:00:00Z',
          location: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Public API Security', () => {
    it('should not expose private fields in public endpoint', async () => {
      // Create event
      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Go Live',
          startAt: '2026-09-01T10:00:00Z',
          endAt: '2026-09-01T12:00:00Z',
          location: 'São Paulo',
          status: 'PUBLISHED',
          internalNotes: 'VIP list pending',
          createdBy: 'cto@example.com'
        });

      expect(createResponse.status).toBe(201);

      // Query public endpoint
      const publicResponse = await request(app)
        .get('/api/public/events?locations=Paulo');

      expect(publicResponse.status).toBe(200);
      expect(publicResponse.body.events).toHaveLength(1);

      const publicEvent = publicResponse.body.events[0];
      
      // Check public fields are present
      expect(publicEvent).toHaveProperty('id');
      expect(publicEvent).toHaveProperty('title', 'Go Live');
      expect(publicEvent).toHaveProperty('startAt', '2026-09-01T10:00:00Z');
      expect(publicEvent).toHaveProperty('endAt', '2026-09-01T12:00:00Z');
      expect(publicEvent).toHaveProperty('location', 'São Paulo');
      expect(publicEvent).toHaveProperty('status', 'PUBLISHED');
      expect(publicEvent).toHaveProperty('isUpcoming', true);

      // Check private fields are NOT present
      expect(publicEvent).not.toHaveProperty('internalNotes');
      expect(publicEvent).not.toHaveProperty('createdBy');
      expect(publicEvent).not.toHaveProperty('updatedAt');
    });
  });

  describe('Status Transition Flow', () => {
    it('should follow complete lifecycle: DRAFT -> PUBLISHED -> CANCELLED', async () => {
      // Create event with DRAFT status
      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Lifecycle Event',
          startAt: '2026-10-01T10:00:00Z',
          endAt: '2026-10-01T12:00:00Z',
          location: 'Test Location',
          status: 'DRAFT'
        });

      expect(createResponse.status).toBe(201);
      const eventId = createResponse.body.id;

      // Verify DRAFT event is not in public endpoint
      let publicResponse = await request(app).get('/api/public/events');
      expect(publicResponse.body.events.find((e: { id: string }) => e.id === eventId)).toBeUndefined();

      // Publish the event
      const publishResponse = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'PUBLISHED' });

      expect(publishResponse.status).toBe(200);
      expect(publishResponse.body.status).toBe('PUBLISHED');

      // Verify PUBLISHED event appears in public endpoint
      publicResponse = await request(app).get('/api/public/events');
      expect(publicResponse.body.events.find((e: { id: string }) => e.id === eventId)).toBeDefined();

      // Cancel the event
      const cancelResponse = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CANCELLED' });

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.status).toBe('CANCELLED');

      // Verify CANCELLED event still appears in public endpoint with correct status
      publicResponse = await request(app).get('/api/public/events');
      const cancelledEvent = publicResponse.body.events.find((e: { id: string }) => e.id === eventId);
      expect(cancelledEvent).toBeDefined();
      expect(cancelledEvent.status).toBe('CANCELLED');
    });

    it('should prevent transition from PUBLISHED back to DRAFT', async () => {
      // Create and publish event
      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Event',
          startAt: '2026-10-01T10:00:00Z',
          endAt: '2026-10-01T12:00:00Z',
          location: 'Test Location',
          status: 'PUBLISHED'
        });

      const eventId = createResponse.body.id;

      // Try to move back to DRAFT
      const response = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'DRAFT' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_TRANSITION');
    });

    it('should prevent transition from CANCELLED to DRAFT', async () => {
      // Create and cancel event
      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Event',
          startAt: '2026-10-01T10:00:00Z',
          endAt: '2026-10-01T12:00:00Z',
          location: 'Test Location',
          status: 'CANCELLED'
        });

      const eventId = createResponse.body.id;

      // Try to move back to DRAFT
      const response = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'DRAFT' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_TRANSITION');
    });
  });

  describe('Event Querying', () => {
    beforeEach(async () => {
      // Create test events
      const events = [
        {
          title: 'Event 1',
          startAt: '2026-06-01T10:00:00Z',
          endAt: '2026-06-01T12:00:00Z',
          location: 'New York',
          status: 'PUBLISHED'
        },
        {
          title: 'Event 2',
          startAt: '2026-07-01T10:00:00Z',
          endAt: '2026-07-01T12:00:00Z',
          location: 'Los Angeles',
          status: 'PUBLISHED'
        },
        {
          title: 'Event 3',
          startAt: '2026-08-01T10:00:00Z',
          endAt: '2026-08-01T12:00:00Z',
          location: 'New York',
          status: 'DRAFT'
        }
      ];

      for (const event of events) {
        await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${authToken}`)
          .send(event);
      }
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/events?dateFrom=2026-06-01&dateTo=2026-06-30')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].title).toBe('Event 1');
    });

    it('should filter by locations', async () => {
      const response = await request(app)
        .get('/api/events?locations=New York')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/events?status=PUBLISHED')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(2);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/events?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2
      });
    });

    it('should respect max limit of 100', async () => {
      const response = await request(app)
        .get('/api/events?limit=200')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(100);
    });
  });

  describe('Event Summary with Caching', () => {
    it('should stream summary with MISS on first request', async () => {
      // Create event
      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Summary Test Event',
          startAt: '2026-09-01T10:00:00Z',
          endAt: '2026-09-01T12:00:00Z',
          location: 'Test Location',
          status: 'PUBLISHED'
        });

      const eventId = createResponse.body.id;

      // Request summary
      const response = await request(app)
        .get(`/api/public/events/${eventId}/summary`);

      expect(response.status).toBe(200);
      expect(response.headers['x-summary-cache']).toBe('MISS');
      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.text).toContain('Summary Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/public/events/non-existent-id/summary');

      expect(response.status).toBe(404);
    });

    it('should return 404 for draft event', async () => {
      // Create draft event
      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Draft Event',
          startAt: '2026-09-01T10:00:00Z',
          endAt: '2026-09-01T12:00:00Z',
          location: 'Test Location',
          status: 'DRAFT'
        });

      const eventId = createResponse.body.id;

      // Try to get summary
      const response = await request(app)
        .get(`/api/public/events/${eventId}/summary`);

      expect(response.status).toBe(404);
    });
  });

  describe('Update Event', () => {
    it('should update event internalNotes', async () => {
      // Create event
      const createResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Test',
          startAt: '2026-09-01T10:00:00Z',
          endAt: '2026-09-01T12:00:00Z',
          location: 'Test Location',
          status: 'DRAFT',
          internalNotes: 'Initial notes'
        });

      const eventId = createResponse.body.id;

      // Update notes
      const updateResponse = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ internalNotes: 'Updated notes' });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.internalNotes).toBe('Updated notes');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .patch('/api/events/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'PUBLISHED' });

      expect(response.status).toBe(404);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});

