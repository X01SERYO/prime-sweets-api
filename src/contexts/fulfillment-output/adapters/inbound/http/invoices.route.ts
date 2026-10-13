import { Router, Request, Response } from 'express';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import { listInvoicesSchema } from './invoices.schema';

export function createInvoicesRouter(container: any) {
  const router = Router();

  router.get('/', validateRequest(listInvoicesSchema), async (req: Request, res: Response) => {
    const useCase = container.get('fulfillment.application.list_invoices_use_case');
    const salesDayId = req.query.salesDayId as string;
    return httpResponse(res, await useCase.run({ salesDayId }));
  });

  return router;
}
