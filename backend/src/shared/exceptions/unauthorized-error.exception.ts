import { DomainException } from './domain.exception';

export class UnauthorizedError extends DomainException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}
