import { Branch } from '../entities/branch.entity';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';

export interface IBranchService {
  create(createBranchDto: CreateBranchDto): Promise<Branch>;
  findAll(tenantId?: string): Promise<Branch[]>;
  findOne(id: string): Promise<Branch>;
  findByTenant(tenantId: string): Promise<Branch[]>;
  update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch>;
  remove(id: string): Promise<void>;
}
