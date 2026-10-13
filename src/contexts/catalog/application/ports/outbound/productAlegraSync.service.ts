export interface ProductAlegraSyncService {
  sync(input: {
    alegraId: string;
    name: string | null;
    wholesalePrice: number | null;
    retailPrice: number | null;
  }): Promise<void>;
}
