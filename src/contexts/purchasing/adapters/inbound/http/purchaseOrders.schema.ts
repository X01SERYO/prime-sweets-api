import { z } from 'zod';

export const createPurchaseOrderSchema = {
  body: z.object({
    supplierId: z.string().uuid(),
    lines: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        itemName: z.string().trim().min(1).optional()
      })
    ),
    assortment: z
      .array(
        z.object({
          productId: z.string().uuid(),
          itemName: z.string().trim().min(1)
        })
      )
      .optional()
  })
};

export const listPurchaseOrdersSchema = {
  query: z.object({
    supplierId: z.string().uuid(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional()
  })
};

export const updatePurchaseOrderSchema = {
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    lines: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        itemName: z.string().trim().min(1).optional()
      })
    ),
    assortment: z
      .array(
        z.object({
          productId: z.string().uuid(),
          itemName: z.string().trim().min(1)
        })
      )
      .optional()
  })
};

export const getPurchaseOrderSchema = {
  params: z.object({
    id: z.string().trim().min(1)
  })
};
