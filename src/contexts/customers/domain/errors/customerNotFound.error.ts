import { NotFoundError } from '../../../../shared/domain/errors/notFound.error';

export class CustomerNotFoundError extends NotFoundError {
  readonly code = 'CUSTOMER_NOT_FOUND';

  constructor(identifier: string) {
    super(`Customer "${identifier}" was not found`);
  }
}
