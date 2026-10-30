import { z } from 'zod';

export const openSalesDaySchema = {
  body: z.object({
    sellerId: z.string().trim().min(1, 'sellerId is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
  })
};

export const getCurrentSalesDaySchema = {
  query: z.object({
    sellerId: z.string().trim().min(1, 'sellerId is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
  })
};

export const listRecentSalesDaysSchema = {
  query: z.object({
    sellerId: z.string().trim().min(1, 'sellerId is required')
  })
};

export const salesDayIdParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Sales Day id is required')
  })
};
