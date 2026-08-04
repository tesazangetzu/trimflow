import { HttpException } from '@nestjs/common';

export class DomainException extends HttpException {
  constructor(message: string, status: number) {
    super(message, status);
    this.name = this.constructor.name;
  }
}
