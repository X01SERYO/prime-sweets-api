import { z } from 'zod';
import { RequestValidationSchema } from '../../../../../apps/middlewares/validateRequest';

export const createSaleSchema: RequestValidationSchema = {
  body: z.object({
    salesDayId: z.string().trim().min(1, 'salesDayId is required'),
    customerId: z.string().trim().min(1, 'customerId is required'),
    items: z
      .array(
        z.object({
          productId: z.string().trim().min(1, 'productId is required'),
          itemName: z.string().trim().min(1).optional(),
          quantity: z.number().int().positive({ message: 'quantity must be a positive integer' })
        })
      )
      .optional()
  })
};

export const getSaleSchema: RequestValidationSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'id is required')
  })
};

export const listSalesSchema: RequestValidationSchema = {
  query: z.object({
    salesDayId: z.string().trim().optional(),
    customerId: z.string().trim().optional(),
    status: z.enum(['DRAFT', 'CONFIRMED', 'VOIDED']).optional()
  })
};

export const addSaleItemSchema: RequestValidationSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Sale id is required')
  }),
  body: z.object({
    productId: z.string().trim().min(1, 'productId is required'),
    itemName: z.string().trim().min(1).optional(),
    quantity: z.number().int().positive({ message: 'quantity must be a positive integer' })
  })
};

export const updateSaleItemQuantitySchema: RequestValidationSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Sale id is required'),
    productId: z.string().trim().min(1, 'productId is required')
  }),
  body: z.object({
    quantity: z.number().int().positive({ message: 'quantity must be a positive integer' })
  })
};

export const updateSaleItemNameSchema: RequestValidationSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Sale id is required'),
    productId: z.string().trim().min(1, 'productId is required')
  }),
  body: z.object({
    itemName: z.string().trim().min(1, 'itemName cannot be empty')
  })
};

export const removeSaleItemSchema: RequestValidationSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Sale id is required'),
    productId: z.string().trim().min(1, 'productId is required')
  })
};

export const confirmSaleSchema: RequestValidationSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Sale id is required')
  })
};

export const voidSaleSchema: RequestValidationSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Sale id is required')
  })
};
