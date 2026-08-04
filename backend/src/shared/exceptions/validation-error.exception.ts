import { DomainException } from './domain.exception';

export class ValidationError extends DomainException {
  constructor(message = 'Validation failed') {
    super(message, 422);
  }
}
