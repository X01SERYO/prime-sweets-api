import { Router, Request, Response } from 'express';
import { AppContainer } from '../../../../../apps/dependency-injection/appContainer';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { routeParam } from '../../../../../apps/http/bearerToken';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import {
  getCustomerSchema,
  createCustomerSchema,
  updateCustomerSchema,
  searchCustomerSchema
} from './customers.schema';

export function createCustomersRouter(container: AppContainer) {
  const router = Router();

  router.get('/search', validateRequest(searchCustomerSchema), async (req: Request, res: Response) => {
    const query =
      typeof req.query.q === 'string'
        ? req.query.q
        : typeof req.query.search === 'string'
        ? req.query.search
        : undefined;
    const useCase = container.get('customers.application.search_customers_use_case');
    return httpResponse(res, await useCase.run({ query }));
  });

  router.get('/', validateRequest(searchCustomerSchema), async (req: Request, res: Response) => {
    const query =
      typeof req.query.q === 'string'
        ? req.query.q
        : typeof req.query.search === 'string'
        ? req.query.search
        : undefined;

    const useCase = container.get('customers.application.search_customers_use_case');
    return httpResponse(res, await useCase.run({ query }));
  });

  router.get('/:id', validateRequest(getCustomerSchema), async (req: Request, res: Response) => {
    const useCase = container.get('customers.application.get_customer_use_case');
    return httpResponse(res, await useCase.run(routeParam(req.params.id)));
  });

  router.post('/', validateRequest(createCustomerSchema), async (req: Request, res: Response) => {
    const useCase = container.get('customers.application.create_customer_use_case');
    return httpResponse(
      res,
      await useCase.run({
        documentType: req.body.documentType,
        documentNumber: req.body.documentNumber,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address
      }),
      201
    );
  });

  router.put('/:id', validateRequest(updateCustomerSchema), async (req: Request, res: Response) => {
    const useCase = container.get('customers.application.update_customer_use_case');
    return httpResponse(
      res,
      await useCase.run({
        id: routeParam(req.params.id),
        documentType: req.body.documentType,
        documentNumber: req.body.documentNumber,
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        address: req.body.address
      })
    );
  });

  return router;
}
