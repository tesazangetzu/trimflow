import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../entities/branch.entity';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { EntityNotFoundException } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('BranchService');
  }

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = this.branchRepository.create(createBranchDto);
    const saved = await this.branchRepository.save(branch);
    this.logger.log(`Branch created: ${saved.id}`);
    return saved;
  }

  async findAll(tenantId?: string): Promise<Branch[]> {
    const where = tenantId ? { tenantId } : {};
    return this.branchRepository.find({ where, relations: ['tenant'] });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id }, relations: ['tenant'] });
    if (!branch) {
      throw new EntityNotFoundException(`Branch with id "${id}" not found`);
    }
    return branch;
  }

  async findByTenant(tenantId: string): Promise<Branch[]> {
    return this.branchRepository.find({ where: { tenantId }, relations: ['tenant'] });
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);
    Object.assign(branch, updateBranchDto);
    const updated = await this.branchRepository.save(branch);
    this.logger.log(`Branch updated: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.branchRepository.softDelete(id);
    this.logger.log(`Branch soft-deleted: ${id}`);
  }
}
