import { DomainException } from './domain.exception';

export class ForbiddenError extends DomainException {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}
