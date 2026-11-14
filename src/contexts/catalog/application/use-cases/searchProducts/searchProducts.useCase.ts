import { Result } from '@/shared/application/result/result';
import { Product, ProductPrimitives } from '@/contexts/catalog/domain/entities/product';
import { ProductRepository } from '@/contexts/catalog/application/ports/outbound/product.repository';
import { SearchProductsDto } from '@/contexts/catalog/application/dto/searchProducts.dto';

export class SearchProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async run(dto: SearchProductsDto): Promise<Result<ProductPrimitives[]>> {
    const query = dto.query?.trim();

    const products = query
      ? await this.productRepository.search(query)
      : await this.productRepository.findAll();

    return Result.ok(products.map((product: Product) => product.toPrimitives()));
  }
}
