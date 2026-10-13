import { z } from 'zod';

export const getCustomerSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Customer id is required')
  })
};

export const createCustomerSchema = {
  body: z.object({
    documentType: z.string().trim().min(1, 'documentType is required'),
    documentNumber: z.string().trim().min(1, 'documentNumber is required'),
    name: z.string().trim().min(1, 'name is required'),
    phone: z.string().trim().nullable().optional(),
    email: z.string().trim().nullable().optional(),
    address: z.string().trim().nullable().optional()
  })
};

export const updateCustomerSchema = {
  params: z.object({
    id: z.string().trim().min(1, 'Customer id is required')
  }),
  body: z.object({
    documentType: z.string().trim().min(1, 'documentType cannot be empty').optional(),
    documentNumber: z.string().trim().min(1, 'documentNumber cannot be empty').optional(),
    name: z.string().trim().min(1, 'name cannot be empty').optional(),
    phone: z.string().trim().nullable().optional(),
    email: z.string().trim().nullable().optional(),
    address: z.string().trim().nullable().optional()
  })
};

export const searchCustomerSchema = {
  query: z.object({
    q: z.string().optional(),
    search: z.string().optional()
  })
};
