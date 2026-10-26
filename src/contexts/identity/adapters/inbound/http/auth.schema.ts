import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email('email is required'),
    password: z.string().min(1, 'password is required')
  })
};
