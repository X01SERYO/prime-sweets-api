import { randomUUID } from 'crypto';
import { Result } from '../../../../../shared/application/result/result';
import { Brand, BrandPrimitives } from '../../../domain/entities/brand';
import { BrandRepository } from '../../ports/outbound/brand.repository';
import { BrandAlreadyExistsError } from '../../../domain/errors/brandAlreadyExists.error';
import { InvalidBrandError } from '../../../domain/errors/invalidBrand.error';
import { CreateBrandDto } from '../../dto/createBrand.dto';

export class CreateBrandUseCase {
  constructor(private readonly brandRepository: BrandRepository) {}

  async run(dto: CreateBrandDto): Promise<Result<BrandPrimitives>> {
    try {
      const brand = Brand.create(randomUUID(), dto.name, dto.code);
      const byName = await this.brandRepository.findByName(brand.name);
      if (byName) {
        return Result.fail(new BrandAlreadyExistsError('name', brand.name));
      }

      const byCode = await this.brandRepository.findByCode(brand.code);
      if (byCode) {
        return Result.fail(new BrandAlreadyExistsError('code', brand.code));
      }

      await this.brandRepository.save(brand);
      return Result.ok(brand.toPrimitives());
    } catch (error) {
      return Result.fail(new InvalidBrandError(error instanceof Error ? error.message : 'Invalid brand'));
    }
  }
}
