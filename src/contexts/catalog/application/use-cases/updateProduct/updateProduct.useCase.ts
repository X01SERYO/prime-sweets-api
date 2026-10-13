import { Result } from '../../../../../shared/application/result/result';
import { ProductPrimitives } from '../../../domain/entities/product';
import { ProductRepository } from '../../ports/outbound/product.repository';
import { ProductAlegraSyncService } from '../../ports/outbound/productAlegraSync.service';
import { ProductNotFoundError } from '../../../domain/errors/productNotFound.error';
import { InvalidProductError } from '../../../domain/errors/invalidProduct.error';
import { UpdateProductDto } from '../../dto/updateProduct.dto';

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

    if (dto.name === undefined && dto.wholesalePrice === undefined && dto.retailPrice === undefined) {
      return Result.fail(new InvalidProductError('name, wholesalePrice or retailPrice is required'));
    }

    const wholesalePrice = optionalNumber(dto.wholesalePrice, 'wholesalePrice');
    if (!wholesalePrice.isSuccess) return Result.fail(wholesalePrice.error!);
    const retailPrice = optionalNumber(dto.retailPrice, 'retailPrice');
    if (!retailPrice.isSuccess) return Result.fail(retailPrice.error!);

    const name = dto.name === undefined ? undefined : dto.name === null ? null : String(dto.name).trim();
    if (name === '') {
      return Result.fail(new InvalidProductError('name cannot be empty'));
    }

    const updated = product.update({
      name,
      wholesalePrice: wholesalePrice.value,
      retailPrice: retailPrice.value
    });

    try {
      await this.productRepository.save(updated);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to persist product'));
    }

    try {
      await this.productAlegraSyncService.sync({
        alegraId: updated.alegraId,
        name: updated.name,
        wholesalePrice: updated.wholesalePrice,
        retailPrice: updated.retailPrice
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to sync product to Alegra'));
    }

    return Result.ok(updated.toPrimitives());
  }
}
