# Event Service API - Technical README

A minimal but production-ready backend service for event management with admin (authenticated) and public endpoints, built with Node.js/TypeScript.

## How to Run Backend Locally

### Prerequisites
- Node.js 20+
- npm or yarn
- Docker & Docker Compose (optional, for containerized setup)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd challenge
```

2. **Install dependencies**
```bash
npm install
```

3. **Set environment variables (optional)**
```bash
# Create .env file or use defaults
PORT=3000
ADMIN_TOKEN=admin-token-123
```

4. **Run in development mode**
```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot-reload enabled.

5. **Build for production**
```bash
npm run build
npm start
```

### Docker Compose Setup

Run the entire service using Docker Compose:

```bash
# Build and start
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The service will be available at `http://localhost:3000` with health checks enabled.

## Example cURL/Postman Calls for All Endpoints

### Base URL
```
http://localhost:3000/api
```

**API Versioning:**
- `/api/v1/*` - Versioned endpoints (recommended)
- `/api/*` - Legacy endpoints (backward compatibility)

### Authentication
Admin endpoints require a Bearer token:
```
Authorization: Bearer admin-token-123
```

### Request ID Tracking
All requests include a `X-Request-ID` header for tracking. You can provide your own via `X-Request-ID` header, or one will be auto-generated.

### Admin Endpoints (🔒 Require Authentication)

#### 1. Create Event
**POST** `/events`

```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer admin-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Go Live Event",
    "startAt": "2025-12-15T20:00:00.000Z",
    "endAt": "2025-12-15T23:00:00.000Z",
    "location": "São Paulo",
    "status": "DRAFT",
    "internalNotes": "VIP list pending",
    "createdBy": "admin@example.com"
  }'
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Go Live Event",
  "startAt": "2025-12-15T20:00:00.000Z",
  "endAt": "2025-12-15T23:00:00.000Z",
  "location": "São Paulo",
  "status": "DRAFT",
  "internalNotes": "VIP list pending",
  "createdBy": "admin@example.com",
  "updatedAt": "2025-11-04T10:00:00Z"
}
```

#### 2. Update Event
**PATCH** `/events/:id`

```bash
curl -X PATCH http://localhost:3000/api/events/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer admin-token-123" \
  -H "Content-Type: application/json" \
  -d '{"status": "PUBLISHED"}'
```

**Response (200):** Updated event object

#### 3. Get All Events (Admin)
**GET** `/events`

```bash
# Get all events
curl -H "Authorization: Bearer admin-token-123" \
  http://localhost:3000/api/events

# Filter by date range
curl -H "Authorization: Bearer admin-token-123" \
  "http://localhost:3000/api/events?dateFrom=2025-12-01&dateTo=2025-12-31"

# Filter by locations
curl -H "Authorization: Bearer admin-token-123" \
  "http://localhost:3000/api/events?locations=São Paulo,Buenos Aires"

# Filter by status with pagination
curl -H "Authorization: Bearer admin-token-123" \
  "http://localhost:3000/api/events?status=PUBLISHED&page=1&limit=20"
```

**Response (200):**
```json
{
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Go Live Event",
      "startAt": "2025-12-15T20:00:00.000Z",
      "endAt": "2025-12-15T23:00:00.000Z",
      "location": "São Paulo",
      "status": "PUBLISHED",
      "internalNotes": "VIP list pending",
      "createdBy": "admin@example.com",
      "updatedAt": "2025-11-04T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Public Endpoints (🔓 No Authentication)

#### 4. Get Public Events
**GET** `/public/events`

```bash
# Get all public events
curl "http://localhost:3000/api/public/events"

# Filter by location
curl "http://localhost:3000/api/public/events?locations=Paulo"

# Filter by date range with pagination
curl "http://localhost:3000/api/public/events?dateFrom=2025-12-01&dateTo=2025-12-31&page=1&limit=20"
```

**Response (200):**
```json
{
  "events": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Go Live Event",
      "startAt": "2025-12-15T20:00:00.000Z",
      "endAt": "2025-12-15T23:00:00.000Z",
      "location": "São Paulo",
      "status": "PUBLISHED",
      "isUpcoming": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### 5. Stream Event Summary (AI-Generated)
**GET** `/public/events/:id/summary`

```bash
curl -N http://localhost:3000/api/public/events/550e8400-e29b-41d4-a716-446655440000/summary
```

**Response (200):** SSE stream with:
- `Content-Type: text/event-stream`
- `X-Summary-Cache: HIT|MISS` header

#### 6. Health Check
**GET** `/health`

```bash
curl http://localhost:3000/api/health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T10:00:00Z",
  "uptime": 3600
}
```

### Postman Collection

A complete Postman collection is available in the `postman/` directory:
- `Event_Service.postman_collection.json` - All endpoints with examples
- `Event_Service.postman_environment.json` - Environment variables
- `POSTMAN_GUIDE.md` - Usage guide

Import both files into Postman to get started quickly.

### Error Response Format

All errors follow this format:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "startAt",
        "message": "Must be in the future"
      }
    ]
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` (400): Invalid input data
- `UNAUTHORIZED` (401): Missing or invalid authentication
- `NOT_FOUND` (404): Resource not found
- `INVALID_TRANSITION` (400): Invalid status transition
- `INTERNAL_ERROR` (500): Unexpected server error

## Test Commands

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with verbose output
npm test -- --verbose

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

### CI/CD

The project includes GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Runs on push/PR to main/develop branches
- Tests on Node.js 20.x
- Runs linter
- Runs test suite with coverage
- Uploads coverage reports (optional)

To enable CI:
1. Push code to GitHub
2. GitHub Actions will automatically run on push/PR
3. Check Actions tab in GitHub repository

### Test Coverage

The test suite includes:
- ✅ Authentication enforcement (401 errors)
- ✅ Event creation with all validations
- ✅ Status transition flows (DRAFT → PUBLISHED → CANCELLED)
- ✅ Public API security (no private field leaks)
- ✅ Pagination and filtering
- ✅ Date range queries
- ✅ Location-based queries
- ✅ Cache hit/miss behavior
- ✅ Error handling
- ✅ Health check endpoint

## Architecture Notes

### Module Boundaries

```
src/
├── types/              # TypeScript interfaces and enums
│   ├── event.types.ts  # Event, PublicEvent, DTOs
│   └── error.types.ts  # Error handling types
│
├── config/             # Configuration management
│   └── index.ts       # Environment variables
│
├── utils/              # Shared utilities
│   ├── logger.ts      # Simple logger
│   ├── date.utils.ts  # Date helpers
│   └── async-handler.ts # Async route wrapper
│
├── validators/         # Input validation
│   └── event.validator.ts # Zod schemas + business rules
│
├── middlewares/        # Express middlewares
│   ├── auth.middleware.ts         # Bearer token authentication
│   ├── error.middleware.ts        # Centralized error handling
│   └── request-id.middleware.ts  # Request ID tracking
│
├── repositories/       # Data access layer
│   └── event.repository.ts   # Interface + InMemory implementation
│
├── services/           # Business logic layer
│   ├── event.service.ts       # CRUD + business logic
│   ├── notification.service.ts # Mock notifications
│   ├── cache.service.ts        # In-memory caching
│   ├── summary.service.ts      # Mock AI summaries
│   ├── ai-summary.service.ts   # OpenAI integration (commented)
│   └── sns-notification.service.ts # AWS SNS integration (commented)
│
├── controllers/        # HTTP request handlers
│   └── event.controller.ts
│
├── routes/             # API route definitions
│   ├── event.routes.ts
│   └── health.routes.ts
│
├── app.ts              # Express app setup
└── index.ts            # Server entry point
```

**Design Principles:**
- **Separation of Concerns**: Each layer has a single responsibility
- **Dependency Injection**: Services receive dependencies via constructor
- **Interface-based**: Repository uses interface for easy swapping
- **Open/Closed**: Easy to extend without modifying existing code

### API Versioning

The API supports versioning:
- **Versioned endpoints**: `/api/v1/*` (recommended for new integrations)
- **Legacy endpoints**: `/api/*` (maintained for backward compatibility)

Both endpoints provide identical functionality. Use versioned endpoints for new integrations to ensure future compatibility.

### Request ID Tracking

All requests are tracked with a unique request ID:
- **Auto-generated**: UUID v4 if not provided
- **Header**: `X-Request-ID` in both request and response
- **Logging**: All logs include request ID for correlation
- **Usage**: Pass `X-Request-ID` header to track requests across services

Example:
```bash
curl -H "X-Request-ID: my-custom-id" \
  http://localhost:3000/api/v1/events
```

### Structured JSON Logging

All logs are structured JSON format for easy parsing and analysis:

```json
{
  "timestamp": "2025-11-07T15:30:00.000Z",
  "level": "info",
  "message": "POST /api/v1/events",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "path": "/api/v1/events",
  "query": {},
  "ip": "127.0.0.1"
}
```

**Log Levels:**
- `info`: General information
- `warn`: Warning messages
- `error`: Error messages with stack traces
- `debug`: Debug information (development only)

### Rate Limiting Strategy for Public Endpoints

**Recommended for Production:**

1. **Use `express-rate-limit` middleware**
   ```bash
   npm install express-rate-limit
   ```

2. **Implementation:**
   ```typescript
   import rateLimit from 'express-rate-limit';

   const publicLimiter = rateLimit({
     windowMs: 60000,        // 1 minute
     max: 100,               // 100 requests per window per IP
     message: {
       error: {
         code: 'RATE_LIMIT',
         message: 'Too many requests, please try again later'
       }
     },
     standardHeaders: true,
     legacyHeaders: false
   });

   router.get('/public/events', publicLimiter, controller.getPublicEvents);
   router.get('/public/events/:id/summary', publicLimiter, controller.streamEventSummary);
   ```

3. **For Multi-Instance Deployments:**
   - Use Redis store for distributed rate limiting
   - Configure Redis connection in rate limiter
   - Ensures consistent limits across all instances

4. **Admin Endpoints:**
   - Higher limits (e.g., 1000 requests/minute)
   - Or IP whitelist-based approach
   - Consider API key-based rate limiting

### Production DB Schema Outline

#### PostgreSQL Schema

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
  internal_notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_dates CHECK (start_at < end_at),
  CONSTRAINT check_future_start CHECK (start_at >= NOW())
);

-- Indexes for common queries
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_location ON events(location);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_location_status ON events(location, status);
CREATE INDEX idx_events_status_start_at ON events(status, start_at);

-- Composite index for date range queries
CREATE INDEX idx_events_start_at_end_at ON events(start_at, end_at);
```

#### DynamoDB Schema

```
Table: Events
Partition Key: id (String)
Sort Key: startAt (String)

Attributes:
- id: String (UUID)
- title: String (max 200 chars)
- startAt: String (ISO 8601)
- endAt: String (ISO 8601)
- location: String
- status: String (DRAFT|PUBLISHED|CANCELLED)
- internalNotes: String (optional)
- createdBy: String (optional)
- updatedAt: String (ISO 8601)

Global Secondary Indexes:

GSI1: StatusStartAtIndex
  Partition Key: status (String)
  Sort Key: startAt (String)
  Use case: Query events by status and date range

GSI2: LocationStartAtIndex
  Partition Key: location (String)
  Sort Key: startAt (String)
  Use case: Query events by location and date range
```

### Caching Approach

**Current Implementation (In-Memory):**
- **Cache Key**: `eventId`
- **Cache Value**: `{ hash: string, summary: string }`
- **Hash Algorithm**: SHA-256 based on `title + location + startAt + endAt`
- **Invalidation**: Automatic on hash mismatch + explicit invalidation on event update
- **Storage**: `Map<string, CacheEntry>` in memory

**Production Strategy (Redis/ElastiCache):**

1. **Configuration:**
   ```typescript
   {
     ttl: 3600,                    // 1 hour
     keyPrefix: 'event:summary:',
     maxSize: 10000,               // Max cached items
     evictionPolicy: 'LRU'
   }
   ```

2. **Cache Key Structure:**
   ```
   event:summary:{eventId}:{hash}
   ```

3. **Cache Invalidation Events:**
   - Event update → Clear cache for event
   - Event deletion → Clear cache for event
   - Batch invalidation → Clear all event caches (if needed)

4. **Cache Warming:**
   - Pre-generate summaries for popular events
   - Background job to refresh summaries periodically
   - Consider TTL extension for frequently accessed events

5. **Monitoring:**
   - Track cache hit/miss ratio
   - Monitor cache size and memory usage
   - Alert on low hit rates (< 70%)

### Deployment Strategy

#### Containerization

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Docker Compose (for local development):**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ADMIN_TOKEN=${ADMIN_TOKEN}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

#### AWS Deployment Options

**1. ECS Fargate (Recommended)**

**Architecture:**
```
Internet → ALB → ECS Fargate Tasks → RDS/ElastiCache
```

**Steps:**
1. Build and push Docker image to ECR
2. Create ECS task definition with container image
3. Create ECS service with Fargate launch type
4. Configure Application Load Balancer (ALB)
5. Set up auto-scaling based on CPU/Memory
6. Configure CloudWatch logs and metrics
7. Set up security groups and IAM roles

**Benefits:**
- Serverless container management
- Auto-scaling
- Pay-per-use
- Easy CI/CD integration

**2. Lambda + API Gateway**

**Architecture:**
```
API Gateway → Lambda Functions → DynamoDB/ElastiCache
```

**Steps:**
1. Refactor handlers to Lambda-compatible format
2. Bundle with dependencies
3. Deploy to Lambda with layers
4. Configure API Gateway routes
5. Set up provisioned concurrency for consistent performance
6. Configure DynamoDB for data storage

**Benefits:**
- Zero server management
- Pay-per-request
- Auto-scaling
- Lower operational overhead

**3. EKS (Kubernetes)**

**Architecture:**
```
Internet → Ingress → Kubernetes Services → Pods → RDS/ElastiCache
```

**Steps:**
1. Push image to ECR
2. Create Kubernetes deployment manifests
3. Deploy to EKS cluster
4. Set up HPA (Horizontal Pod Autoscaler)
5. Configure ingress controller
6. Set up service mesh (optional)

**Benefits:**
- Full Kubernetes ecosystem
- Multi-cloud portability
- Advanced orchestration
- Service mesh capabilities

#### Infrastructure as Code (Terraform)

**Recommended Structure:**
```
terraform/
├── main.tf              # Main infrastructure
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── modules/
│   ├── networking/      # VPC, subnets, security groups
│   ├── ecs/             # ECS cluster, task definition, service
│   ├── alb/             # Application Load Balancer
│   ├── rds/             # PostgreSQL database
│   ├── cache/           # ElastiCache (Redis)
│   └── monitoring/      # CloudWatch, alarms
```

**Key Resources:**
- VPC with public/private subnets
- ECS Fargate cluster
- Application Load Balancer
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- CloudWatch log groups
- IAM roles and policies

## AI Usage Notes

### Where AI Helped

1. **Boilerplate Generation**
   - Initial project structure setup
   - TypeScript configuration files (`tsconfig.json`, `jest.config.js`)
   - Test skeleton generation
   - Package.json structure

2. **Code Patterns**
   - Repository pattern implementation
   - Middleware structure and error handling patterns
   - Service layer organization
   - Dependency injection setup

3. **Documentation**
   - API documentation formatting
   - cURL examples generation
   - Architecture diagrams and explanations
   - README structure

4. **Test Cases**
   - Edge case identification
   - Test scenario generation
   - Assertion patterns
   - Test data setup

### Where Human Judgment Was Critical

1. **Architecture Decisions**
   - Choice of in-memory storage with clear migration path to PostgreSQL/DynamoDB
   - Layered architecture design (controllers → services → repositories)
   - Interface-based repository pattern for flexibility
   - Caching strategy with hash-based invalidation
   - Decision to use SSE for streaming instead of WebSockets

2. **Business Logic**
   - Status transition rules (DRAFT → PUBLISHED → CANCELLED)
   - Validation constraints (title max length, future dates, etc.)
   - Public vs private field segregation
   - Notification triggers and timing
   - Pagination limits and defaults

3. **Error Handling**
   - Error code taxonomy (VALIDATION_ERROR, UNAUTHORIZED, etc.)
   - Error response format design
   - Status code selection (400 vs 422, etc.)
   - Error detail structure

4. **Testing Strategy**
   - Which scenarios to prioritize
   - Black-box vs white-box approach decision
   - Coverage thresholds (70% minimum)
   - Test data management

5. **Production Readiness**
   - Rate limiting strategy and thresholds
   - Health check implementation details
   - Logging structure and levels
   - Deployment strategy selection (ECS vs Lambda vs EKS)
   - Security considerations (authentication, field privacy)

6. **Code Quality**
   - Code review and refactoring decisions
   - Removing unnecessary complexity
   - Simplifying logging implementation
   - Removing hardcoded values in favor of config

## Additional Resources

- **Postman Collection**: See `postman/` directory
- **Environment Variables**: See `.env.example`
- **TypeScript Config**: See `tsconfig.json`
- **Test Configuration**: See `jest.config.js`

## License

MIT
