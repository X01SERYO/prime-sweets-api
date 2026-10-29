import { Router, Request, Response } from 'express';
import { httpResponse } from '../../../../../apps/controllers/httpResponse';
import { validateRequest } from '../../../../../apps/middlewares/validateRequest';
import {
  createSaleSchema,
  getSaleSchema,
  listSalesSchema,
  addSaleItemSchema,
  updateSaleItemQuantitySchema,
  updateSaleItemNameSchema,
  removeSaleItemSchema,
  confirmSaleSchema,
  voidSaleSchema
} from './sales.schema';

export function createSalesRouter(container: any) {
  const router = Router();

  router.post('/', validateRequest(createSaleSchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales.application.create_sale_use_case');
    return httpResponse(res, await useCase.run(req.body), 201);
  });

  router.get('/', validateRequest(listSalesSchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales.application.list_sales_use_case');
    return httpResponse(res, await useCase.run(req.query));
  });

  router.get('/:id', validateRequest(getSaleSchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales.application.get_sale_use_case');
    return httpResponse(res, await useCase.run(req.params.id));
  });

  router.post('/:id/items', validateRequest(addSaleItemSchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales.application.add_sale_item_use_case');
    return httpResponse(
      res,
      await useCase.run({
        saleId: req.params.id,
        productId: req.body.productId,
        itemName: req.body.itemName,
        quantity: req.body.quantity
      }),
      201
    );
  });

  router.put(
    '/:id/items/:itemId/quantity',
    validateRequest(updateSaleItemQuantitySchema),
    async (req: Request, res: Response) => {
      const useCase = container.get('sales.application.update_sale_item_quantity_use_case');
      return httpResponse(
        res,
        await useCase.run({
          saleId: req.params.id,
          itemId: req.params.itemId,
          quantity: req.body.quantity
        })
      );
    }
  );

  router.put(
    '/:id/items/:itemId/name',
    validateRequest(updateSaleItemNameSchema),
    async (req: Request, res: Response) => {
      const useCase = container.get('sales.application.update_sale_item_name_use_case');
      return httpResponse(
        res,
        await useCase.run({
          saleId: req.params.id,
          itemId: req.params.itemId,
          itemName: req.body.itemName
        })
      );
    }
  );

  router.delete(
    '/:id/items/:itemId',
    validateRequest(removeSaleItemSchema),
    async (req: Request, res: Response) => {
      const useCase = container.get('sales.application.remove_sale_item_use_case');
      return httpResponse(
        res,
        await useCase.run({
          saleId: req.params.id,
          itemId: req.params.itemId
        })
      );
    }
  );

  router.post('/:id/confirm', validateRequest(confirmSaleSchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales.application.confirm_sale_use_case');
    return httpResponse(res, await useCase.run({ saleId: req.params.id }));
  });

  router.post('/:id/void', validateRequest(voidSaleSchema), async (req: Request, res: Response) => {
    const useCase = container.get('sales.application.void_sale_use_case');
    return httpResponse(res, await useCase.run({ saleId: req.params.id }));
  });

  return router;
}
