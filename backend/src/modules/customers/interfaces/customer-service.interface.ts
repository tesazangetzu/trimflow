import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

export interface ICustomerService {
  create(createCustomerDto: CreateCustomerDto): Promise<Customer>;
  findAll(branchId?: string): Promise<Customer[]>;
  findOne(id: string): Promise<Customer>;
  findByBranch(branchId: string): Promise<Customer[]>;
  findByEmail(email: string): Promise<Customer | null>;
  findByEmailAndBranch(email: string, branchId: string): Promise<Customer | null>;
  update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer>;
  remove(id: string): Promise<void>;
}
