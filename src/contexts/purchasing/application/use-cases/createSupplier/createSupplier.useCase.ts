import { IdGenerator } from '@/shared/application/ports/idGenerator';
import { Result } from '@/shared/application/result/result';
import { SupplierRepository } from '@/contexts/purchasing/application/ports/outbound/supplier.repository';
import { Supplier, SupplierPrimitives } from '@/contexts/purchasing/domain/entities/supplier';
import { SupplierNameInvalidError } from '@/contexts/purchasing/domain/errors/supplierNameInvalid.error';

export class CreateSupplierUseCase {
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly ids: IdGenerator
  ) {}

  async run(name: string): Promise<Result<SupplierPrimitives>> {
    try {
      const supplier = Supplier.create(this.ids.next(), name);
      await this.suppliers.save(supplier);
      return Result.ok(supplier.toPrimitives());
    } catch (error) {
      if (error instanceof SupplierNameInvalidError) {
        return Result.fail(error);
      }
      throw error;
    }
  }
}
