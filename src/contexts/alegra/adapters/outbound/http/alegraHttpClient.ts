import { AlegraClient, AlegraItemCreate, AlegraItemUpdate } from '../../../application/ports/outbound/alegraClient.port';
import { AlegraRequestError } from '../../../domain/errors/alegraRequest.error';

export class AlegraHttpClient implements AlegraClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  async updateItem(id: string, update: AlegraItemUpdate): Promise<unknown> {
    const payload: Record<string, unknown> = {};
    if (update.name) {
      payload.name = update.name;
    }
    if (update.prices && update.prices.length > 0) {
      payload.price = update.prices;
    }

    const response = await fetch(`${this.baseUrl}/items/${id}`, {
      method: 'PUT',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${this.token}`
      },
      body: JSON.stringify(payload)
    });

    const body = await response.text();
    let parsed: unknown = null;
    if (body) {
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new AlegraRequestError(response.status, body);
      }
    }

    const item = parsed && typeof parsed === 'object' ? (parsed as { id?: unknown }) : null;
    const confirmed = item?.id !== undefined && item?.id !== null && String(item.id) !== '';
    if (!response.ok || !confirmed) {
      throw new AlegraRequestError(
        response.status,
        body || `Alegra did not confirm the update for item ${id}`
      );
    }

    return parsed;
  }

  async createItem(input: AlegraItemCreate): Promise<string> {
    const response = await fetch(`${this.baseUrl}/items`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${this.token}`
      },
      body: JSON.stringify({ name: input.name, price: input.prices })
    });
    const body = await response.text();
    let parsed: unknown = null;
    if (body) {
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new AlegraRequestError(response.status, body);
      }
    }
    const item = parsed && typeof parsed === 'object' ? (parsed as { id?: unknown }) : null;
    const id = item?.id === undefined || item?.id === null ? '' : String(item.id);
    if (!response.ok || id === '') {
      throw new AlegraRequestError(response.status, body || 'Alegra did not return the created item id');
    }
    return id;
  }
}
