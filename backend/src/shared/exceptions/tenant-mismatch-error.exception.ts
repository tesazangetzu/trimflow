import { DomainException } from './domain.exception';

export class TenantMismatchError extends DomainException {
  constructor(message = 'Tenant mismatch') {
    super(message, 403);
  }
}
