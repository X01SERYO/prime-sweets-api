import { Request, Response, Router } from 'express';
import { AppContainer } from '@/apps/dependency-injection/appContainer';
import { httpResponse } from '@/apps/controllers/httpResponse';
import { routeParam } from '@/apps/http/bearerToken';
import { validateRequest } from '@/apps/middlewares/validateRequest';
import {
  createPurchaseOrderSchema,
  getPurchaseOrderSchema,
  listPurchaseOrdersSchema,
  updatePurchaseOrderSchema
} from './purchaseOrders.schema';

export function createPurchaseOrdersRouter(container: AppContainer) {
  const router = Router();

  router.get('/', validateRequest(listPurchaseOrdersSchema), async (req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.list_purchase_orders_use_case');
    return httpResponse(
      res,
      await useCase.run({
        supplierId: req.query.supplierId as string,
        page: req.query.page as unknown as number | undefined,
        pageSize: req.query.pageSize as unknown as number | undefined
      })
    );
  });

  router.post('/', validateRequest(createPurchaseOrderSchema), async (req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.create_purchase_order_use_case');
    return httpResponse(res, await useCase.run(req.body.supplierId, req.body.lines, req.body.assortment ?? []), 201);
  });

  router.patch('/:id', validateRequest(updatePurchaseOrderSchema), async (req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.update_purchase_order_use_case');
    return httpResponse(res, await useCase.run(routeParam(req.params.id), req.body.lines, req.body.assortment ?? []));
  });

  router.get('/:id', validateRequest(getPurchaseOrderSchema), async (req: Request, res: Response) => {
    const useCase = container.get('purchasing.application.get_purchase_order_use_case');
    return httpResponse(res, await useCase.run(routeParam(req.params.id)));
  });

  return router;
}
