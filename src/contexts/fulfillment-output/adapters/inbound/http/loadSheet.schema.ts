import { z } from 'zod';
import { RequestValidationSchema } from '../../../../../apps/middlewares/validateRequest';

export const generateLoadSheetSchema: RequestValidationSchema = {
  query: z.object({
    deliveryDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'deliveryDate must be YYYY-MM-DD')
  })
};
