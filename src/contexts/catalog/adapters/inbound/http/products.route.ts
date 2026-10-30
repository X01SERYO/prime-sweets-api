import { Router, Request, Response } from 'express';
import { AppContainer } from '../../../../../apps/dependency-injection/appContainer';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { routeParam } from '../../../../../apps/http/bearerToken';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import {
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  searchProductSchema
} from './products.schema';

export function createProductsRouter(container: AppContainer) {
  const router = Router();

  router.get('/search', validateRequest(searchProductSchema), async (req: Request, res: Response) => {
    const query =
      typeof req.query.q === 'string'
        ? req.query.q
        : typeof req.query.search === 'string'
        ? req.query.search
        : undefined;
    const useCase = container.get('catalog.application.search_products_use_case');
    return httpResponse(res, await useCase.run({ query }));
  });

  router.get('/', validateRequest(searchProductSchema), async (req: Request, res: Response) => {
    const query =
      typeof req.query.q === 'string'
        ? req.query.q
        : typeof req.query.search === 'string'
        ? req.query.search
        : undefined;
    if (query !== undefined) {
      const searchUseCase = container.get('catalog.application.search_products_use_case');
      return httpResponse(res, await searchUseCase.run({ query }));
    }
    const useCase = container.get('catalog.application.list_products_use_case');
    return httpResponse(res, await useCase.run());
  });

  router.get('/:id', validateRequest(productIdParamSchema), async (req: Request, res: Response) => {
    const useCase = container.get('catalog.application.get_product_use_case');
    return httpResponse(res, await useCase.run(routeParam(req.params.id)));
  });

  router.post('/', validateRequest(createProductSchema), async (req: Request, res: Response) => {
    const useCase = container.get('catalog.application.create_product_use_case');
    return httpResponse(res, await useCase.run(req.body), 201);
  });

  router.put('/:id', validateRequest(updateProductSchema), async (req: Request, res: Response) => {
    const useCase = container.get('catalog.application.update_product_use_case');
    return httpResponse(
      res,
      await useCase.run({
        id: routeParam(req.params.id),
        name: req.body.name,
        wholesalePrice: req.body.wholesalePrice,
        retailPrice: req.body.retailPrice
      })
    );
  });

  router.delete('/:id', validateRequest(productIdParamSchema), async (req: Request, res: Response) => {
    const useCase = container.get('catalog.application.delete_product_use_case');
    return httpResponse(res, await useCase.run(routeParam(req.params.id)));
  });

  return router;
}
