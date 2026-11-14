import { Result } from '@/shared/application/result/result';
import { ProductPrimitives } from '@/contexts/catalog/domain/entities/product';
import { ProductRepository } from '@/contexts/catalog/application/ports/outbound/product.repository';
import { ProductNotFoundError } from '@/contexts/catalog/domain/errors/productNotFound.error';

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
