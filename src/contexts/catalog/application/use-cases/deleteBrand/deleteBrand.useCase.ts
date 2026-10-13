import { Result } from '../../../../../shared/application/result/result';
import { BrandRepository } from '../../ports/outbound/brand.repository';
import { BrandNotFoundError } from '../../../domain/errors/brandNotFound.error';
import { BrandInUseError } from '../../../domain/errors/brandInUse.error';

export class DeleteBrandUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  async run(id: string): Promise<Result<void>> {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      return Result.fail(new BrandNotFoundError(id));
    }

    try {
      await this.brandRepository.delete(id);
      return Result.ok(undefined);
    } catch {
      return Result.fail(new BrandInUseError(id));
    }
  }
}
