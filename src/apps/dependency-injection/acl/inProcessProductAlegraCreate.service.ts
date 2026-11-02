import { CreateProductItemUseCase } from '../../../contexts/alegra/application/createProductItem/createProductItem.useCase';
import { ProductAlegraCreateService } from '../../../contexts/catalog/application/ports/outbound/productAlegraCreate.service';

export class InProcessProductAlegraCreateService implements ProductAlegraCreateService {
  constructor(private readonly createProductItemUseCase: CreateProductItemUseCase) {}

  async create(input: { name: string; wholesalePrice: number; retailPrice: number }): Promise<string> {
    return this.createProductItemUseCase.run(input);
  }
}
