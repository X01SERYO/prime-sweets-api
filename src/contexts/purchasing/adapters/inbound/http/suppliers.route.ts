import { Request, Response, Router } from 'express';
import { AppContainer } from '@/apps/dependency-injection/appContainer';
import { httpResponse } from '@/apps/controllers/httpResponse';
import { routeParam } from '@/apps/http/bearerToken';
import { validateRequest } from '@/apps/middlewares/validateRequest';
import {
  createSupplierSchema,
  getSupplierSchema,
  listSuppliersSchema,
  renameSupplierSchema,
  setSupplierProductsSchema
} from './suppliers.schema';

export function createSuppliersRouter(container: AppContainer) {
  const router = Router();

  router.get('/', validateRequest(listSuppliersSchema), async (_req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.list_suppliers_use_case');
    return httpResponse(res, await useCase.run());
  });

  router.post('/', validateRequest(createSupplierSchema), async (req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.create_supplier_use_case');
    return httpResponse(res, await useCase.run(req.body.name), 201);
  });

  router.get('/:id', validateRequest(getSupplierSchema), async (req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.get_supplier_use_case');
    return httpResponse(res, await useCase.run(routeParam(req.params.id)));
  });

  router.patch('/:id', validateRequest(renameSupplierSchema), async (req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.rename_supplier_use_case');
    return httpResponse(res, await useCase.run(routeParam(req.params.id), req.body.name));
  });

  router.put('/:id/products', validateRequest(setSupplierProductsSchema), async (req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.set_supplier_products_use_case');
    return httpResponse(res, await useCase.run(routeParam(req.params.id), req.body.productIds));
  });

  return router;
}
