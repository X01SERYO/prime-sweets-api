export interface ProductAlegraCreateService {
  create(input: { name: string; wholesalePrice: number; retailPrice: number }): Promise<string>;
}
