import { PublicEvent } from '../types/event.types';

export class SummaryService {
  /**
   * Generates a deterministic mock summary based on event data
   * In production, this would call an actual AI API (OpenAI, Anthropic, etc.)
   */
  generateSummary(event: PublicEvent): string {
    const date = new Date(event.startAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const time = new Date(event.startAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const summary = `Join us for "${event.title}" on ${date} at ${time} in ${event.location}. ` +
      `This ${event.isUpcoming ? 'upcoming' : 'past'} event promises an unforgettable experience. ` +
      `Don't miss out on this opportunity to be part of something special! ` +
      `${event.isUpcoming ? 'Register now to secure your spot.' : 'Check out our other upcoming events!'}`;

    return summary;
  }

  /**
   * Splits a summary into chunks for streaming
   * Simulates token-by-token streaming
   */
  *chunkSummary(summary: string, chunkSize: number = 3): Generator<string> {
    const words = summary.split(' ');
    
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      yield i + chunkSize < words.length ? chunk + ' ' : chunk;
    }
  }

  /**
   * Simulates streaming delay
   */
  async delay(ms: number = 50): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

