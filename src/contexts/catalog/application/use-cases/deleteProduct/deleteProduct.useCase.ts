import { Result } from '@shared/application/result/result';
import { ProductRepository } from '@catalog/application/ports/outbound/product.repository';
import { ProductNotFoundError } from '@catalog/domain/errors/productNotFound.error';

export class DeleteProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(id: string): Promise<Result<void>> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      return Result.fail(new ProductNotFoundError(id));
    }

    await this.productRepository.delete(id);
    return Result.ok(undefined);
  }
}
