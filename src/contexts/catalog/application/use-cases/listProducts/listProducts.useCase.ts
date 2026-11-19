import { Result } from '@/shared/application/result/result';
import { Product, ProductPrimitives } from '@/contexts/catalog/domain/entities/product';
import { ProductRepository } from '@/contexts/catalog/application/ports/outbound/product.repository';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(dto?: { page?: number; pageSize?: number; query?: string; brands?: string[] }): Promise<Result<ProductPrimitives[] | { items: ProductPrimitives[]; total: number; page: number; pageSize: number }>> {
    if (dto?.page === undefined) {
      const products = await this.productRepository.findAll();
      return Result.ok(products.map((product: Product) => product.toPrimitives()));
    }

    const pageSize = dto.pageSize ?? 20;
    const listed = await this.productRepository.page(dto.query, dto.page, pageSize, dto.brands);
    const lastPage = Math.max(1, Math.ceil(listed.total / pageSize));
    const page = Math.min(dto.page, lastPage);
    const visible = page === dto.page ? listed : await this.productRepository.page(dto.query, page, pageSize, dto.brands);
    return Result.ok({
      items: visible.items.map(product => product.toPrimitives()),
      total: visible.total,
      page,
      pageSize
    });
  }
}
