import { z } from 'zod';
import { RequestValidationSchema } from '../../../../../apps/middlewares/validateRequest';

export const generateLoadSheetSchema: RequestValidationSchema = {
  params: z.object({
    salesDayId: z.string().trim().min(1, 'salesDayId is required')
  })
};
