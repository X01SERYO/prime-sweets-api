import { Result } from '@/shared/application/result/result';
import { SupplierListItem, SupplierRepository } from '@/contexts/purchasing/application/ports/outbound/supplier.repository';

export class ListSuppliersUseCase {
  constructor(private readonly suppliers: SupplierRepository) {}

  async run(): Promise<Result<SupplierListItem[]>> {
    return Result.ok(await this.suppliers.list());
  }
}
