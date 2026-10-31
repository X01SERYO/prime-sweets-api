import { Router, Request, Response } from 'express';
import { AppContainer } from '../../../../../apps/dependency-injection/appContainer';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import { generateLoadSheetSchema } from './loadSheet.schema';

export function createLoadSheetsRouter(container: AppContainer) {
  const router = Router();

  router.get('/', validateRequest(generateLoadSheetSchema), async (req: Request, res: Response) => {
    const useCase = container.get('fulfillment.application.generate_load_sheet_use_case');
    return httpResponse(res, await useCase.run({ deliveryDate: String(req.query.deliveryDate) }));
  });

  return router;
}
