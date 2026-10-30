import { Router, Request, Response } from 'express';
import { AppContainer } from '../../../../../apps/dependency-injection/appContainer';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { routeParam } from '../../../../../apps/http/bearerToken';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import {
  openSalesDaySchema,
  getCurrentSalesDaySchema,
  salesDayIdParamSchema
} from './salesDay.schema';

export function createSalesDaysRouter(container: AppContainer) {
  const router = Router();

  router.post('/open', validateRequest(openSalesDaySchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales_day.application.open_current_sales_day_use_case');
    return httpResponse(
      res,
      await useCase.run({
        sellerId: req.body.sellerId,
        date: req.body.date
      }),
      201
    );
  });

  router.get('/current', validateRequest(getCurrentSalesDaySchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales_day.application.get_current_sales_day_use_case');
    return httpResponse(
      res,
      await useCase.run({
        sellerId: String(req.query.sellerId),
        date: req.query.date ? String(req.query.date) : undefined
      })
    );
  });

  router.post('/:id/close', validateRequest(salesDayIdParamSchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales_day.application.close_sales_day_use_case');
    return httpResponse(
      res,
      await useCase.run({
        id: routeParam(req.params.id)
      })
    );
  });

  router.post('/:id/reopen', validateRequest(salesDayIdParamSchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales_day.application.reopen_current_sales_day_use_case');
    return httpResponse(
      res,
      await useCase.run({
        id: routeParam(req.params.id)
      })
    );
  });

  return router;
}
