import { z } from 'zod';

export const brandIdParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Brand id is required')
  })
};

export const createBrandSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'name is required'),
    code: z.string().trim().min(1, 'code is required')
  })
};

export const updateBrandSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Brand id is required')
  }),
  body: z
    .object({
      name: z.string().trim().min(1, 'name cannot be empty').optional(),
      code: z.string().trim().min(1, 'code cannot be empty').optional()
    })
    .refine((data) => data.name !== undefined || data.code !== undefined, {
      message: 'At least one of name or code must be provided'
    })
};
