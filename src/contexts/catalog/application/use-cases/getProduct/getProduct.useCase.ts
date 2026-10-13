import { Result } from '../../../../../shared/application/result/result';
import { ProductPrimitives } from '../../../domain/entities/product';
import { ProductRepository } from '../../ports/outbound/product.repository';
import { ProductNotFoundError } from '../../../domain/errors/productNotFound.error';

export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(id: string): Promise<Result<ProductPrimitives>> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      return Result.fail(new ProductNotFoundError(id));
    }

    return Result.ok(product.toPrimitives());
  }
}
