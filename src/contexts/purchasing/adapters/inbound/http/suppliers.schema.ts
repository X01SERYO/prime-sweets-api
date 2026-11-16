import { z } from 'zod';

const id = z.string().trim().min(1);

export const listSuppliersSchema = {};

export const createSupplierSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(120)
  })
};

export const renameSupplierSchema = {
  params: z.object({ id }),
  body: z.object({
    name: z.string().trim().min(1).max(120)
  })
};

export const getSupplierSchema = {
  params: z.object({ id })
};

export const setSupplierProductsSchema = {
  params: z.object({ id }),
  body: z.object({
    productIds: z.array(z.string().uuid())
  })
};
