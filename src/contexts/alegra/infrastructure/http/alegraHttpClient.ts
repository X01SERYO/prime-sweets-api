import { AlegraClient, AlegraItemUpdate } from '../../domain/interfaces/alegraClient.interface';
import { AlegraRequestError } from '../../domain/errors/alegraRequest.error';

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

    if (!response.ok) {
      throw new AlegraRequestError(response.status, body);
    }

    return body ? JSON.parse(body) : null;
  }
}
