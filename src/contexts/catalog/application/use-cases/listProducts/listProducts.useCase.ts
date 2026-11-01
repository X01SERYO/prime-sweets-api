import { Result } from '../../../../../shared/application/result/result';
import { Product, ProductPrimitives } from '../../../domain/entities/product';
import { ProductRepository } from '../../ports/outbound/product.repository';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(dto?: { page?: number; pageSize?: number; query?: string }): Promise<Result<ProductPrimitives[] | { items: ProductPrimitives[]; total: number; page: number; pageSize: number }>> {
    if (dto?.page === undefined) {
      const products = await this.productRepository.findAll();
      return Result.ok(products.map((product: Product) => product.toPrimitives()));
    }

    const pageSize = dto.pageSize ?? 20;
    const listed = await this.productRepository.page(dto.query, dto.page, pageSize);
    return Result.ok({
      items: listed.items.map(product => product.toPrimitives()),
      total: listed.total,
      page: dto.page,
      pageSize
    });
  }
}
