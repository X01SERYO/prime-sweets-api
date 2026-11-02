import { Result } from '../../../../../shared/application/result/result';
import { ProductPrimitives } from '../../../domain/entities/product';
import { ProductRepository } from '../../ports/outbound/product.repository';
import { ProductAlegraSyncService } from '../../ports/outbound/productAlegraSync.service';
import { ProductNotFoundError } from '../../../domain/errors/productNotFound.error';
import { InvalidProductError } from '../../../domain/errors/invalidProduct.error';
import { ProductAlegraSyncError } from '../../../domain/errors/productAlegraSync.error';
import { UpdateProductDto } from '../../dto/updateProduct.dto';

function presentMoney(value: unknown, field: string): Result<number | undefined> {
  if (value === undefined) {
    return Result.ok(undefined);
  }
  if (value === null || value === '' || typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return Result.fail(new InvalidProductError(`${field} must be a number greater than or equal to 0`));
  }
  return Result.ok(value);
}

function presentCount(value: unknown, field: string): Result<number | undefined> {
  if (value === undefined) {
    return Result.ok(undefined);
  }
  if (value === null || value === '' || typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    return Result.fail(new InvalidProductError(`${field} must be an integer greater than or equal to 0`));
  }
  return Result.ok(value);
}

export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productAlegraSyncService: ProductAlegraSyncService
  ) {}

  async run(dto: UpdateProductDto): Promise<Result<ProductPrimitives>> {
    const product = await this.productRepository.findById(dto.id);
    if (!product) {
      return Result.fail(new ProductNotFoundError(dto.id));
    }

    const fields = [
      dto.name,
      dto.wholesaleCost,
      dto.wholesalePrice,
      dto.retailCost,
      dto.retailPrice,
      dto.units,
      dto.pack
    ];
    if (fields.every(field => field === undefined)) {
      return Result.fail(new InvalidProductError('At least one field is required'));
    }

    const name = dto.name === undefined ? undefined : String(dto.name).trim();
    if (name === '') {
      return Result.fail(new InvalidProductError('name cannot be empty'));
    }

    const wholesaleCost = presentMoney(dto.wholesaleCost, 'wholesaleCost');
    if (!wholesaleCost.isSuccess) return Result.fail(wholesaleCost.error!);
    const wholesalePrice = presentMoney(dto.wholesalePrice, 'wholesalePrice');
    if (!wholesalePrice.isSuccess) return Result.fail(wholesalePrice.error!);
    const retailCost = presentMoney(dto.retailCost, 'retailCost');
    if (!retailCost.isSuccess) return Result.fail(retailCost.error!);
    const retailPrice = presentMoney(dto.retailPrice, 'retailPrice');
    if (!retailPrice.isSuccess) return Result.fail(retailPrice.error!);
    const units = presentCount(dto.units, 'units');
    if (!units.isSuccess) return Result.fail(units.error!);
    const pack = presentCount(dto.pack, 'pack');
    if (!pack.isSuccess) return Result.fail(pack.error!);

    const updated = product.update({
      name,
      wholesaleCost: wholesaleCost.value,
      wholesalePrice: wholesalePrice.value,
      retailCost: retailCost.value,
      retailPrice: retailPrice.value,
      units: units.value,
      pack: pack.value
    });

    const notifyName = dto.name !== undefined;
    const notifyPrices = dto.wholesalePrice !== undefined || dto.retailPrice !== undefined;
    if (notifyName || notifyPrices) {
      try {
        await this.productAlegraSyncService.sync({
          alegraId: updated.alegraId,
          ...(notifyName ? { name: updated.name } : {}),
          ...(notifyPrices
            ? { wholesalePrice: updated.wholesalePrice ?? 0, retailPrice: updated.retailPrice ?? 0 }
            : {})
        });
      } catch (error) {
        console.error('Alegra product sync failed. The local product was not saved.', error);
        const reason = error instanceof Error ? error.message : 'Alegra update failed';
        return Result.fail(new ProductAlegraSyncError(reason));
      }
    }

    try {
      await this.productRepository.save(updated);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to persist product'));
    }

    return Result.ok(updated.toPrimitives());
  }
}
