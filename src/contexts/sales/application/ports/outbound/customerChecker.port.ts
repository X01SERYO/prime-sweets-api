export interface CustomerChecker {
  customerExists(customerId: string): Promise<boolean>;
}
