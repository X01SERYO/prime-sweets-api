import { Router, Request, Response } from 'express';
import { AppContainer } from '@/apps/dependency-injection/appContainer';
import { httpResponse } from '@/apps/controllers/httpResponse';
import { routeParam } from '@/apps/http/bearerToken';
import { validateRequest } from '@/apps/middlewares/validateRequest';
import {
  addRetailItemSchema,
  getTodayRetailDaySchema,
  removeRetailItemSchema,
  setRetailItemQuantitySchema,
} from './retailDays.schema';

export function createRetailDaysRouter(container: AppContainer) {
  const router = Router();

  router.get('/today', validateRequest(getTodayRetailDaySchema), async (_req: Request, res: Response) => {
    const useCase = container.get('retail.application.get_today_retail_day_use_case');
    return httpResponse(res, await useCase.run());
  });

  router.post('/today/items', validateRequest(addRetailItemSchema), async (req: Request, res: Response) => {
    const useCase = container.get('retail.application.add_retail_item_use_case');
    return httpResponse(res, await useCase.run(req.body), 201);
  });

  router.patch(
    '/today/items/:productId',
    validateRequest(setRetailItemQuantitySchema),
    async (req: Request, res: Response) => {
      const useCase = container.get('retail.application.set_retail_item_quantity_use_case');
      return httpResponse(
        res,
        await useCase.run({
          productId: routeParam(req.params.productId),
          quantity: req.body.quantity,
        })
      );
    }
  );

  router.delete(
    '/today/items/:productId',
    validateRequest(removeRetailItemSchema),
    async (req: Request, res: Response) => {
      const useCase = container.get('retail.application.remove_retail_item_use_case');
      return httpResponse(res, await useCase.run(routeParam(req.params.productId)));
    }
  );

  return router;
}
