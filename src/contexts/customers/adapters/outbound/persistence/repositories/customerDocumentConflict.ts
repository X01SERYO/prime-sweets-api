const UNIQUE_CUSTOMER_DOCUMENT = 'UQ_customers_document';

export function isUniqueCustomerDocumentViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const failure = error as { code?: string; constraint?: string; driverError?: { code?: string; constraint?: string } };
  const code = failure.driverError?.code ?? failure.code;
  const constraint = failure.driverError?.constraint ?? failure.constraint;

  return code === '23505' && constraint === UNIQUE_CUSTOMER_DOCUMENT;
}
