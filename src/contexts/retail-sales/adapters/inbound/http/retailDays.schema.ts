import { z } from 'zod';
import { RequestValidationSchema } from '@/apps/middlewares/validateRequest';
import { RetailDayStatus } from '@/contexts/retail-sales/domain/entities/retailDay';

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

const businessDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const listRetailDaysSchema: RequestValidationSchema = {
  query: z.object({
    status: z.enum(RetailDayStatus),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional(),
  }),
};

export const reviewRetailDaysSchema: RequestValidationSchema = {
  body: z.object({
    dates: z.array(businessDate).min(1).max(50),
  }),
};
