# AWS SNS Setup Guide

This guide explains how to enable AWS SNS notifications in the Event Service.

## Prerequisites

1. AWS Account with SNS access
2. SNS Topic created in AWS Console
3. IAM user/role with SNS publish permissions
4. Subscriptions configured in SNS Topic (email, SMS, HTTP, etc.)

## Installation

1. **Install AWS SDK for SNS:**
```bash
npm install @aws-sdk/client-sns
```

## Configuration

1. **Update `.env` file with AWS credentials:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:event-notifications
```

2. **Update `src/app.ts`:**
   - Uncomment the SNS import:
   ```typescript
   import { SNSNotificationService } from './services/sns-notification.service';
   ```
   
   - Replace the notification service:
   ```typescript
   // Before:
   const notificationService = new NotificationService();
   
   // After:
   const notificationService = new SNSNotificationService();
   ```

3. **Update `src/services/sns-notification.service.ts`:**
   - Uncomment all the SNS implementation code
   - Remove the fallback console.log statements

## AWS Setup Steps

### 1. Create SNS Topic

```bash
aws sns create-topic --name event-notifications
```

Note the Topic ARN from the response.

### 2. Create Subscriptions

**Email subscription:**
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:event-notifications \
  --protocol email \
  --notification-endpoint admin@example.com
```

**SMS subscription:**
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:event-notifications \
  --protocol sms \
  --notification-endpoint +1234567890
```

**HTTP/HTTPS webhook:**
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:event-notifications \
  --protocol https \
  --notification-endpoint https://api.example.com/webhooks/events
```

### 3. Configure IAM Permissions

Create an IAM policy for SNS publish:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:us-east-1:123456789012:event-notifications"
    }
  ]
}
```

Attach this policy to your IAM user or role.

## Testing

After setup, test by creating/updating events:

```bash
# Create event
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer admin-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "startAt": "2025-12-15T20:00:00.000Z",
    "endAt": "2025-12-15T23:00:00.000Z",
    "location": "Test Location",
    "status": "PUBLISHED"
  }'
```

Check your email/SMS/webhook to verify notifications are received.

## Notification Types

The service sends three types of notifications:

1. **EVENT_CREATED**: When a new event is created
2. **EVENT_PUBLISHED**: When an event status changes from DRAFT to PUBLISHED
3. **EVENT_CANCELLED**: When an event status changes to CANCELLED

Each notification includes:
- `type`: Event type (EVENT_CREATED, EVENT_PUBLISHED, EVENT_CANCELLED)
- `title`: Event title
- `timestamp`: ISO 8601 timestamp

## Troubleshooting

- **"Topic not found"**: Verify the SNS_TOPIC_ARN is correct
- **"Access denied"**: Check IAM permissions for SNS:Publish
- **"Invalid credentials"**: Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- **No notifications received**: Check SNS subscriptions are confirmed (email requires confirmation)

