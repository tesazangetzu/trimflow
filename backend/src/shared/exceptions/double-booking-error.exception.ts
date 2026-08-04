import { DomainException } from './domain.exception';

export class DoubleBookingError extends DomainException {
  constructor(message = 'Double booking detected') {
    super(message, 409);
  }
}
