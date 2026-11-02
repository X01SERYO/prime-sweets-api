import { z } from 'zod';

export const productIdParamSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Product id is required')
  })
};

const optionalNonNegativeNumber = z
  .union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d+)?$/)])
  .transform((val) => Number(val))
  .nullable()
  .optional();

export const createProductSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'name is required'),
    brandId: z.string().trim().nullable().optional(),
    suggestedPrice: optionalNonNegativeNumber,
    units: z.number().int().nonnegative().optional(),
    pack: z.number().int().nonnegative().optional(),
    wholesaleCost: optionalNonNegativeNumber,
    wholesalePrice: optionalNonNegativeNumber,
    retailCost: optionalNonNegativeNumber,
    retailPrice: optionalNonNegativeNumber
  })
};

const updateMoney = z.number().nonnegative();
const updateCount = z.number().int().nonnegative();

export const updateProductSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Product id is required')
  }),
  body: z
    .object({
      name: z.string().trim().min(1, 'name cannot be empty').optional(),
      wholesaleCost: updateMoney.optional(),
      wholesalePrice: updateMoney.optional(),
      retailCost: updateMoney.optional(),
      retailPrice: updateMoney.optional(),
      units: updateCount.optional(),
      pack: updateCount.optional()
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.wholesaleCost !== undefined ||
        data.wholesalePrice !== undefined ||
        data.retailCost !== undefined ||
        data.retailPrice !== undefined ||
        data.units !== undefined ||
        data.pack !== undefined,
      { message: 'At least one field must be provided' }
    )
};

export const searchProductSchema = {
  query: z.object({
    q: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional()
  })
};
