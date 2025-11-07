# OpenAI AI Summary Setup Guide

This guide explains how to enable OpenAI-powered AI summaries for events.

## Prerequisites

1. OpenAI API account with API key
2. Node.js 18+ (for native fetch support, or install `node-fetch` for older versions)

## Installation

No additional packages needed if using Node.js 18+. For older versions:

```bash
npm install node-fetch
```

## Configuration

1. **Update `.env` file with OpenAI credentials:**
```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
OPENAI_MODEL=gpt-3.5-turbo
```

2. **Update `src/controllers/event.controller.ts`:**
   - Comment out the mock implementation (lines 74-84)
   - Uncomment the AI implementation (lines 87-102)
   - Uncomment the import at the top of the commented section

3. **The service is ready to use:**
   - `AISummaryService` is already implemented in `src/services/ai-summary.service.ts`
   - It supports both non-streaming (`generateSummary`) and streaming (`streamSummary`) modes
   - Streaming mode is used for real-time SSE delivery

## Features

### Streaming Summary Generation
- Real-time token-by-token streaming from OpenAI
- Uses OpenAI's streaming API (`stream: true`)
- Automatically handles SSE format for client consumption

### Non-Streaming Summary Generation
- Generates complete summary in one API call
- Useful for batch processing or when streaming isn't needed

### Error Handling
- Graceful error handling with fallback messages
- Logs errors for debugging
- Continues to work even if AI service is temporarily unavailable

## Usage

Once configured, the endpoint works automatically:

```bash
curl -N http://localhost:3000/api/public/events/{event-id}/summary
```

The response will stream AI-generated summaries in real-time.

## Cost Considerations

- **gpt-3.5-turbo**: ~$0.0015 per 1K tokens (input + output)
- Average summary: ~100 tokens = ~$0.00015 per summary
- Caching reduces API calls significantly

## Alternative AI Providers

To use a different AI provider (Anthropic, Cohere, etc.), modify `AISummaryService`:

1. Update the API URL and authentication method
2. Adjust the request/response format
3. Update the streaming parser if needed

## Testing

After setup, test by:

1. Creating a published event
2. Requesting the summary endpoint
3. Verifying real-time streaming works
4. Checking cache behavior (first request = MISS, second = HIT)

## Troubleshooting

- **"OPENAI_API_KEY is required"**: Set the environment variable
- **"Failed to get response reader"**: Check Node.js version (needs 18+ for native fetch)
- **Streaming not working**: Verify `stream: true` is in the request body
- **Rate limits**: OpenAI has rate limits; implement retry logic if needed

