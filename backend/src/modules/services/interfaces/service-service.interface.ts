import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

export interface IServiceService {
  create(createServiceDto: CreateServiceDto): Promise<Service>;
  findAll(branchId?: string): Promise<Service[]>;
  findOne(id: string): Promise<Service>;
  findByBranch(branchId: string): Promise<Service[]>;
  update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service>;
  remove(id: string): Promise<void>;
}
