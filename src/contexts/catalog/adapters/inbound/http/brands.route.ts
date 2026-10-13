import { Router, Request, Response } from 'express';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import {
  brandIdParamSchema,
  createBrandSchema,
  updateBrandSchema
} from './brands.schema';

export function createBrandsRouter(container: any) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const useCase = container.get('catalog.application.list_brands_use_case');
    return httpResponse(res, await useCase.run());
  });

  router.get('/:id', validateRequest(brandIdParamSchema), async (req: Request, res: Response) => {
    const useCase = container.get('catalog.application.get_brand_use_case');
    return httpResponse(res, await useCase.run(req.params.id));
  });

  router.post('/', validateRequest(createBrandSchema), async (req: Request, res: Response) => {
    const useCase = container.get('catalog.application.create_brand_use_case');
    return httpResponse(res, await useCase.run(req.body), 201);
  });

  router.put('/:id', validateRequest(updateBrandSchema), async (req: Request, res: Response) => {
    const useCase = container.get('catalog.application.update_brand_use_case');
    return httpResponse(
      res,
      await useCase.run({
        id: req.params.id,
        name: req.body.name,
        code: req.body.code
      })
    );
  });

  router.delete('/:id', validateRequest(brandIdParamSchema), async (req: Request, res: Response) => {
    const useCase = container.get('catalog.application.delete_brand_use_case');
    return httpResponse(res, await useCase.run(req.params.id));
  });

  return router;
}
