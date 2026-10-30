import { IdGenerator } from '../../../../../shared/application/ports/idGenerator';
import { Result } from '../../../../../shared/application/result/result';
import { Product, ProductPrimitives } from '../../../domain/entities/product';
import { ProductRepository } from '../../ports/outbound/product.repository';
import { BrandRepository } from '../../ports/outbound/brand.repository';
import { ProductAlreadyExistsError } from '../../../domain/errors/productAlreadyExists.error';
import { InvalidProductError } from '../../../domain/errors/invalidProduct.error';
import { BrandNotFoundError } from '../../../domain/errors/brandNotFound.error';
import { CreateProductDto } from '../../dto/createProduct.dto';

function optionalNumber(value: unknown, field: string): Result<number | null | undefined> {
  if (value === undefined) {
    return Result.ok(undefined);
  }
  if (value === null || value === '') {
    return Result.ok(null);
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return Result.fail(new InvalidProductError(`${field} must be a number greater than or equal to 0`));
  }

  return Result.ok(parsed);
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository,
    private readonly ids: IdGenerator
  ) {}

  async run(dto: CreateProductDto): Promise<Result<ProductPrimitives>> {
    const alegraId = dto.alegraId?.toString().trim();
    if (!alegraId) {
      return Result.fail(new InvalidProductError('alegraId is required'));
    }

    const existing = await this.productRepository.findByAlegraId(alegraId);
    if (existing) {
      return Result.fail(new ProductAlreadyExistsError(alegraId));
    }

    let brandId: string | null = null;
    let brandCode = 'GEN';
    if (dto.brandId) {
      const brand = await this.brandRepository.findById(dto.brandId);
      if (!brand) {
        return Result.fail(new BrandNotFoundError(dto.brandId));
      }
      brandCode = brand.toPrimitives().code;
      brandId = brand.toPrimitives().id;
    }

    const code = await this.productRepository.nextProductCode(brandId, brandCode);

    const wholesalePrice = optionalNumber(dto.wholesalePrice, 'wholesalePrice');
    if (!wholesalePrice.isSuccess) return Result.fail(wholesalePrice.error!);
    const retailPrice = optionalNumber(dto.retailPrice, 'retailPrice');
    if (!retailPrice.isSuccess) return Result.fail(retailPrice.error!);
    const wholesaleCost = optionalNumber(dto.wholesaleCost, 'wholesaleCost');
    if (!wholesaleCost.isSuccess) return Result.fail(wholesaleCost.error!);
    const retailCost = optionalNumber(dto.retailCost, 'retailCost');
    if (!retailCost.isSuccess) return Result.fail(retailCost.error!);
    const suggestedPrice = optionalNumber(dto.suggestedPrice, 'suggestedPrice');
    if (!suggestedPrice.isSuccess) return Result.fail(suggestedPrice.error!);

    const product = Product.create({
      id: this.ids.next(),
      alegraId,
      code,
      brandId: dto.brandId ?? null,
      name: dto.name ?? null,
      suggestedPrice: suggestedPrice.value ?? null,
      units: dto.units ?? 0,
      pack: dto.pack ?? 0,
      wholesaleCost: wholesaleCost.value ?? null,
      wholesalePrice: wholesalePrice.value ?? null,
      retailCost: retailCost.value ?? null,
      retailPrice: retailPrice.value ?? null
    });

    await this.productRepository.save(product);
    return Result.ok(product.toPrimitives());
  }
}
