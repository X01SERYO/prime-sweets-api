import { Result } from '../../../../../shared/application/result/result';
import { BrandPrimitives } from '../../../domain/entities/brand';
import { BrandRepository } from '../../ports/outbound/brand.repository';
import { BrandAlreadyExistsError } from '../../../domain/errors/brandAlreadyExists.error';
import { BrandNotFoundError } from '../../../domain/errors/brandNotFound.error';
import { InvalidBrandError } from '../../../domain/errors/invalidBrand.error';
import { UpdateBrandInterface } from '../../dto/updateBrand.dto';

export class UpdateBrandUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  async run(dto: UpdateBrandInterface): Promise<Result<BrandPrimitives>> {
    const brand = await this.brandRepository.findById(dto.id);
    if (!brand) {
      return Result.fail(new BrandNotFoundError(dto.id));
    }

    if (dto.name === undefined && dto.code === undefined) {
      return Result.fail(new InvalidBrandError('name or code is required'));
    }

    try {
      const updated = brand.update({ name: dto.name, code: dto.code });

      const byName = await this.brandRepository.findByName(updated.name);
      if (byName && byName.id !== updated.id) {
        return Result.fail(new BrandAlreadyExistsError('name', updated.name));
      }

      const byCode = await this.brandRepository.findByCode(updated.code);
      if (byCode && byCode.id !== updated.id) {
        return Result.fail(new BrandAlreadyExistsError('code', updated.code));
      }

      await this.brandRepository.save(updated);
      return Result.ok(updated.toPrimitives());
    } catch (error) {
      if (error instanceof InvalidBrandError) {
        return Result.fail(error);
      }
      return Result.fail(new InvalidBrandError(error instanceof Error ? error.message : 'Invalid brand'));
    }
  }
}
