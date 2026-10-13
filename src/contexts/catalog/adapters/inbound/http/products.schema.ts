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
    alegraId: z.string().trim().min(1, 'alegraId is required'),
    name: z.string().trim().nullable().optional(),
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

export const updateProductSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Product id is required')
  }),
  body: z
    .object({
      name: z.string().trim().min(1, 'name cannot be empty').nullable().optional(),
      wholesalePrice: optionalNonNegativeNumber,
      retailPrice: optionalNonNegativeNumber
    })
    .refine(
      (data) =>
        data.name !== undefined ||
        data.wholesalePrice !== undefined ||
        data.retailPrice !== undefined,
      {
        message: 'At least one of name, wholesalePrice, or retailPrice must be provided'
      }
    )
};

export const searchProductSchema = {
  query: z.object({
    q: z.string().optional(),
    search: z.string().optional()
  })
};
