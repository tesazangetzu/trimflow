import { DomainException } from './domain.exception';

export class EntityNotFoundException extends DomainException {
  constructor(message = 'Entity not found') {
    super(message, 404);
  }
}
