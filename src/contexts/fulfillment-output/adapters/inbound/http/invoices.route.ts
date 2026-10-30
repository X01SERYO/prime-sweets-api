import { Router, Request, Response } from 'express';
import { AppContainer } from '../../../../../apps/dependency-injection/appContainer';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { routeParam } from '../../../../../apps/http/bearerToken';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import { listInvoicesSchema, generateInvoiceSchema } from './invoices.schema';

export function createInvoicesRouter(container: AppContainer) {
  const router = Router();

  router.get('/', validateRequest(listInvoicesSchema), async (req: Request, res: Response) => {
    const useCase = container.get('fulfillment.application.list_invoices_use_case');
    const salesDayId = req.query.salesDayId as string;
    return httpResponse(res, await useCase.run({ salesDayId }));
  });

  router.get('/:saleId', validateRequest(generateInvoiceSchema), async (req: Request, res: Response) => {
    const useCase = container.get('fulfillment.application.generate_invoice_use_case');
    return httpResponse(res, await useCase.run({ saleId: routeParam(req.params.saleId) }));
  });

  return router;
}
