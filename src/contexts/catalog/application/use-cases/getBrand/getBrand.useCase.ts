import { Result } from '@shared/application/result/result';
import { BrandPrimitives } from '@catalog/domain/entities/brand';
import { BrandRepository } from '@catalog/application/ports/outbound/brand.repository';
import { BrandNotFoundError } from '@catalog/domain/errors/brandNotFound.error';

export class GetBrandUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  async run(id: string): Promise<Result<BrandPrimitives>> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      return Result.fail(new BrandNotFoundError(id));
    }

    return Result.ok(brand.toPrimitives());
  }
}
