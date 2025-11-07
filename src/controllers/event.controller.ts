import { Request, Response } from 'express';
import { EventService } from '../services/event.service';
import { CacheService } from '../services/cache.service';
import { SummaryService } from '../services/summary.service';
import { 
  createEventSchema, 
  updateEventSchema, 
  queryParamsSchema 
} from '../validators/event.validator';
import { AppError } from '../types/error.types';

export class EventController {
  constructor(
    private eventService: EventService,
    private cacheService: CacheService,
    private summaryService: SummaryService
  ) {}

  createEvent = async (req: Request, res: Response): Promise<void> => {
    const validated = createEventSchema.parse(req.body);
    const event = await this.eventService.createEvent(validated);
    res.status(201).json(event);
  };

  updateEvent = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const validated = updateEventSchema.parse(req.body);
    const event = await this.eventService.updateEvent(id, validated);
    
    this.cacheService.invalidate(id);
    
    res.status(200).json(event);
  };

  getEvents = async (req: Request, res: Response): Promise<void> => {
    const validated = queryParamsSchema.parse(req.query);
    const result = await this.eventService.getEvents(validated);
    res.status(200).json(result);
  };

  getPublicEvents = async (req: Request, res: Response): Promise<void> => {
    const validated = queryParamsSchema.parse(req.query);
    const { status, ...params } = validated;
    const result = await this.eventService.getPublicEvents(params);
    res.status(200).json(result);
  };

  streamEventSummary = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const event = await this.eventService.getPublicEventById(id);
    
    if (!event) {
      throw new AppError('NOT_FOUND', 'Event not found or not published', 404);
    }

    const eventHash = this.cacheService.generateHash(event);
    const cachedSummary = this.cacheService.get(id, eventHash);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (cachedSummary) {
      res.setHeader('X-Summary-Cache', 'HIT');
      res.write(`data: ${cachedSummary}\n\n`);
      res.end();
      return;
    }

    res.setHeader('X-Summary-Cache', 'MISS');

    const summary = this.summaryService.generateSummary(event);
    let fullSummary = '';

    for (const chunk of this.summaryService.chunkSummary(summary)) {
      fullSummary += chunk;
      res.write(`data: ${chunk}\n\n`);
      await this.summaryService.delay(50);
    }

    this.cacheService.set(id, eventHash, fullSummary);

    res.end();

    // Uncomment to use real AI streaming instead of mock:
    // import { AISummaryService } from '../services/ai-summary.service';
    // const aiSummaryService = new AISummaryService();
    // let fullSummary = '';
    // 
    // try {
    //   for await (const chunk of aiSummaryService.streamSummary(event)) {
    //     fullSummary += chunk;
    //     res.write(`data: ${chunk}\n\n`);
    //   }
    //   this.cacheService.set(id, eventHash, fullSummary);
    // } catch (error) {
    //   console.error('AI summary generation failed:', error);
    //   res.write(`data: Error generating summary. Please try again later.\n\n`);
    // }
    // 
    // res.end();
  };
}
