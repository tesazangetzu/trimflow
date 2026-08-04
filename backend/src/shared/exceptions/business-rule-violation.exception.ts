import { DomainException } from './domain.exception';

export class BusinessRuleViolation extends DomainException {
  constructor(message = 'Business rule violation') {
    super(message, 422);
  }
}
