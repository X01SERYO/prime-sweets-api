import { z } from 'zod';
import { RequestValidationSchema } from '../../../../../apps/middlewares/validateRequest';

export const listInvoicesSchema: RequestValidationSchema = {
  query: z.object({
    salesDayId: z.string().trim().min(1, 'salesDayId is required')
  })
};
