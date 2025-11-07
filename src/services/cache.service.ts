import { createHash } from 'crypto';
import { PublicEvent } from '../types/event.types';

export interface CacheEntry {
  summary: string;
  hash: string;
}

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();

  generateHash(event: PublicEvent): string {
    const data = `${event.title}|${event.location}|${event.startAt}|${event.endAt}`;
    return createHash('sha256').update(data).digest('hex');
  }

  get(eventId: string, currentHash: string): string | null {
    const entry = this.cache.get(eventId);
    if (!entry || entry.hash !== currentHash) {
      return null;
    }
    return entry.summary;
  }

  set(eventId: string, hash: string, summary: string): void {
    this.cache.set(eventId, { summary, hash });
  }

  invalidate(eventId: string): void {
    this.cache.delete(eventId);
  }

  clear(): void {
    this.cache.clear();
  }
}

