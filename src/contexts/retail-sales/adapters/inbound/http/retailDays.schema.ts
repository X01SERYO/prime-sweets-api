import { z } from 'zod';
import { RequestValidationSchema } from '@/apps/middlewares/validateRequest';

const retailQuantity = z.number().int().min(1, 'quantity must be an integer of at least 1');

export const getTodayRetailDaySchema: RequestValidationSchema = {};

export const addRetailItemSchema: RequestValidationSchema = {
  body: z.object({
    productId: z.string().trim().min(1, 'productId is required'),
    quantity: retailQuantity,
  }),
};

export const setRetailItemQuantitySchema: RequestValidationSchema = {
  params: z.object({
    productId: z.string().trim().min(1, 'productId is required'),
  }),
  body: z.object({
    quantity: retailQuantity,
  }),
};

export const removeRetailItemSchema: RequestValidationSchema = {
  params: z.object({
    productId: z.string().trim().min(1, 'productId is required'),
  }),
};
