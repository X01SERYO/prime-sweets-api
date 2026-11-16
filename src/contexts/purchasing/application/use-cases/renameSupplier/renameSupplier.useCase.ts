import { Result } from '@/shared/application/result/result';
import { SupplierRepository } from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { SupplierNameInvalidError } from '@/contexts/purchasing/domain/errors/supplierNameInvalid.error';
import { SupplierNotFoundError } from '@/contexts/purchasing/domain/errors/supplierNotFound.error';
import { SupplierPrimitives } from '@/contexts/purchasing/domain/entities/supplier';

export class RenameSupplierUseCase {
  constructor(private readonly suppliers: SupplierRepository) {}

  async run(id: string, name: string): Promise<Result<SupplierPrimitives>> {
    const supplier = await this.suppliers.findById(id);
    if (!supplier) {
      return Result.fail(new SupplierNotFoundError(id));
    }
    try {
      supplier.rename(name);
    } catch (error) {
      if (error instanceof SupplierNameInvalidError) {
        return Result.fail(error);
      }
      throw error;
    }
    await this.suppliers.save(supplier);
    return Result.ok(supplier.toPrimitives());
  }
}
