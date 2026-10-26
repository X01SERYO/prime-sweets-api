import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { TypeOrmBrandRepository } from '../../../contexts/catalog/adapters/outbound/persistence/repositories/typeOrmBrand.repository';
import { TypeOrmProductRepository } from '../../../contexts/catalog/adapters/outbound/persistence/repositories/typeOrmProduct.repository';
import { CreateBrandUseCase } from '../../../contexts/catalog/application/use-cases/createBrand/createBrand.useCase';
import { ListBrandsUseCase } from '../../../contexts/catalog/application/use-cases/listBrands/listBrands.useCase';
import { GetBrandUseCase } from '../../../contexts/catalog/application/use-cases/getBrand/getBrand.useCase';
import { UpdateBrandUseCase } from '../../../contexts/catalog/application/use-cases/updateBrand/updateBrand.useCase';
import { DeleteBrandUseCase } from '../../../contexts/catalog/application/use-cases/deleteBrand/deleteBrand.useCase';
import { CreateProductUseCase } from '../../../contexts/catalog/application/use-cases/createProduct/createProduct.useCase';
import { ListProductsUseCase } from '../../../contexts/catalog/application/use-cases/listProducts/listProducts.useCase';
import { SearchProductsUseCase } from '../../../contexts/catalog/application/use-cases/searchProducts/searchProducts.useCase';
import { GetProductUseCase } from '../../../contexts/catalog/application/use-cases/getProduct/getProduct.useCase';
import { UpdateProductUseCase } from '../../../contexts/catalog/application/use-cases/updateProduct/updateProduct.useCase';
import { DeleteProductUseCase } from '../../../contexts/catalog/application/use-cases/deleteProduct/deleteProduct.useCase';

export function registerCatalogDependencies(container: ContainerBuilder): void {
  const dataSourceRef = new Reference('shared.infrastructure.persistence.typeorm.data_source');

  container
    .register('catalog.domain.brand_repository', TypeOrmBrandRepository)
    .addArgument(dataSourceRef);

  container
    .register('catalog.domain.product_repository', TypeOrmProductRepository)
    .addArgument(dataSourceRef);

  const brandRepoRef = new Reference('catalog.domain.brand_repository');
  const productRepoRef = new Reference('catalog.domain.product_repository');
  const idsRef = new Reference('shared.application.id_generator');
  const alegraSyncRef = new Reference('alegra.infrastructure.product_alegra_sync_service');

  container
    .register('catalog.application.create_brand_use_case', CreateBrandUseCase)
    .addArgument(brandRepoRef)
    .addArgument(idsRef);

  container
    .register('catalog.application.list_brands_use_case', ListBrandsUseCase)
    .addArgument(brandRepoRef);

  container
    .register('catalog.application.get_brand_use_case', GetBrandUseCase)
    .addArgument(brandRepoRef);

  container
    .register('catalog.application.update_brand_use_case', UpdateBrandUseCase)
    .addArgument(brandRepoRef);

  container
    .register('catalog.application.delete_brand_use_case', DeleteBrandUseCase)
    .addArgument(brandRepoRef);

  container
    .register('catalog.application.create_product_use_case', CreateProductUseCase)
    .addArgument(productRepoRef)
    .addArgument(brandRepoRef)
    .addArgument(idsRef);

  container
    .register('catalog.application.list_products_use_case', ListProductsUseCase)
    .addArgument(productRepoRef);

  container
    .register('catalog.application.search_products_use_case', SearchProductsUseCase)
    .addArgument(productRepoRef);

  container
    .register('catalog.application.get_product_use_case', GetProductUseCase)
    .addArgument(productRepoRef);

  container
    .register('catalog.application.update_product_use_case', UpdateProductUseCase)
    .addArgument(productRepoRef)
    .addArgument(alegraSyncRef);

  container
    .register('catalog.application.delete_product_use_case', DeleteProductUseCase)
    .addArgument(productRepoRef);
}
