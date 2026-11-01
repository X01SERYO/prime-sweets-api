export interface ProductAlegraSyncService {
  sync(input: {
    alegraId: string;
    name?: string | null;
    wholesalePrice?: number;
    retailPrice?: number;
  }): Promise<void>;
}
