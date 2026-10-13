import { Result } from '../../../../../shared/application/result/result';
import { Product, ProductPrimitives } from '../../../domain/entities/product';
import { ProductRepository } from '../../ports/outbound/product.repository';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(): Promise<Result<ProductPrimitives[]>> {
    const products = await this.productRepository.findAll();
    return Result.ok(products.map((product: Product) => product.toPrimitives()));
  }
}
