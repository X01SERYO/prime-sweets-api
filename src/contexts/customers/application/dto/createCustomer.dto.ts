export interface CreateCustomerDto {
  documentType: string;
  documentNumber: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}
