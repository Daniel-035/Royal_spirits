import { env } from '../../config/env';

export type ChatIntent =
  | 'browse'
  | 'orders'
  | 'track'
  | 'cancel'
  | 'help'
  | 'product_search'
  | 'unknown';

export interface IntentEntities {
  category?: string;
  maxPrice?: number;
  query?: string;
}

export interface IntentResult {
  intent: ChatIntent;
  entities?: IntentEntities;
  latencyMs: number;
  fallback?: boolean;
}

export interface LLMProvider {
  detectIntent(text: string): Promise<IntentResult>;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const INTENTS: ChatIntent[] = [
  'browse',
  'orders',
  'track',
  'cancel',
  'help',
  'product_search',
  'unknown',
];

function isIntent(value: string): value is ChatIntent {
  return (INTENTS as string[]).includes(value);
}

export class MockLLMService implements LLMProvider {
  detectIntent(text: string): Promise<IntentResult> {
    const start = Date.now();
    const lower = text.toLowerCase().trim();
    const intent = this.match(lower);
    return Promise.resolve({
      intent: intent.intent,
      entities: intent.entities,
      latencyMs: Date.now() - start,
    });
  }

  private match(lower: string): { intent: ChatIntent; entities?: IntentEntities } {
    if (/(^|\s)(hi|hello|hey|start|menu|browse|catalog|shop)(\s|$|[!?.,])/.test(lower)) {
      return { intent: 'browse' };
    }
    if (/(my orders|order history|track order|where.*order|track my)/.test(lower)) {
      return { intent: 'orders' };
    }
    if (/(cancel|refund|stop order)/.test(lower)) {
      return { intent: 'cancel' };
    }
    if (/(help|support|agent|human|talk to)/.test(lower)) {
      return { intent: 'help' };
    }
    const catMatch = lower.match(
      /\b(whiskey|whisky|beer|wine|vodka|rum)\b/,
    );
    const priceMatch = lower.match(/(?:under|below|less than|<)\s*₹?(\d{3,6})/);
    if (catMatch || priceMatch) {
      return {
        intent: 'product_search',
        entities: {
          category: catMatch?.[1],
          maxPrice: priceMatch ? Number(priceMatch[1]) : undefined,
        },
      };
    }
    return { intent: 'unknown' };
  }
}

class GeminiLLMService implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private rateLimit = new Map<string, RateLimitEntry>();
  private maxRpm = 15;

  constructor(apiKey: string, model = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  async detectIntent(text: string): Promise<IntentResult> {
    const start = Date.now();
    this.enforceRateLimit('global');

    const prompt = this.buildPrompt(text);
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 120,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Gemini ${res.status}: ${await res.text()}`);
      }

      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const parsed = this.parseResponse(raw);
      return {
        intent: parsed.intent,
        entities: parsed.entities,
        latencyMs: Date.now() - start,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildPrompt(text: string): string {
    return [
      'You are an intent classifier for a WhatsApp liquor shop chatbot.',
      'Classify the user message into exactly one intent and extract entities.',
      'Reply ONLY with compact JSON, no prose.',
      '',
      'Intents:',
      '- browse: wants to see the catalog or start shopping',
      '- orders: wants to see their order history',
      '- track: wants to track a specific order',
      '- cancel: wants to cancel an order',
      '- help: wants human support',
      '- product_search: looking for a product by category or price',
      '- unknown: cannot be classified',
      '',
      'Entities (only for product_search):',
      '- category: one of whiskey, beer, wine, vodka, rum (lowercase) or omitted',
      '- maxPrice: integer rupee ceiling or omitted',
      '',
      'Output schema: {"intent":"<one of the above>","entities":{"category":"...","maxPrice":123}}',
      'If no entities, return {"intent":"..."}',
      '',
      `User message: "${text.replace(/"/g, '\\"')}"`,
    ].join('\n');
  }

  private parseResponse(raw: string): { intent: ChatIntent; entities?: IntentEntities } {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    try {
      const obj = JSON.parse(cleaned) as { intent?: string; entities?: IntentEntities };
      const intent = isIntent(obj.intent ?? '') ? (obj.intent as ChatIntent) : 'unknown';
      return { intent, entities: obj.entities };
    } catch {
      return { intent: 'unknown' };
    }
  }

  private enforceRateLimit(key: string): void {
    const now = Date.now();
    const entry = this.rateLimit.get(key);
    if (!entry || now - entry.windowStart > 60_000) {
      this.rateLimit.set(key, { count: 1, windowStart: now });
      return;
    }
    entry.count += 1;
    if (entry.count > this.maxRpm) {
      throw new Error(`Gemini rate limit exceeded (${this.maxRpm}/min)`);
    }
  }
}

export function createLLMService(): LLMProvider {
  switch (env.llmProvider) {
    case 'gemini':
      if (!env.geminiApiKey) {
        console.warn('[llm] LLM_PROVIDER=gemini but GEMINI_API_KEY missing; falling back to mock');
        return new MockLLMService();
      }
      return new GeminiLLMService(env.geminiApiKey, env.geminiModel);
    case 'mock':
    default:
      return new MockLLMService();
  }
}

let cached: LLMProvider | null = null;
export function getLLMService(): LLMProvider {
  if (cached) return cached;
  cached = createLLMService();
  return cached;
}
