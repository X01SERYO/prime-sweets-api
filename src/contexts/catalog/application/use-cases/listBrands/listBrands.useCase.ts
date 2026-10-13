import { Result } from '../../../../../shared/application/result/result';
import { Brand, BrandPrimitives } from '../../../domain/entities/brand';
import { BrandRepository } from '../../ports/outbound/brand.repository';

export class ListBrandsUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  async run(): Promise<Result<BrandPrimitives[]>> {
    const brands = await this.brandRepository.findAll();
    return Result.ok(brands.map((brand: Brand) => brand.toPrimitives()));
  }
}
