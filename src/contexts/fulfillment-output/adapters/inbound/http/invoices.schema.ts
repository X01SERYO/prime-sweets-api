import { z } from 'zod';
import { RequestValidationSchema } from '../../../../../apps/middlewares/validateRequest';

export const listInvoicesSchema: RequestValidationSchema = {
  query: z.object({
    deliveryDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'deliveryDate must be YYYY-MM-DD')
  })
};

export const generateInvoiceSchema: RequestValidationSchema = {
  params: z.object({
    saleId: z.string().trim().min(1, 'saleId is required')
  })
};
