import { Barber } from '../entities/barber.entity';
import { CreateBarberDto } from '../dto/create-barber.dto';
import { UpdateBarberDto } from '../dto/update-barber.dto';

export interface IBarberService {
  create(createBarberDto: CreateBarberDto): Promise<Barber>;
  findAll(branchId?: string): Promise<Barber[]>;
  findOne(id: string): Promise<Barber>;
  findByBranch(branchId: string): Promise<Barber[]>;
  update(id: string, updateBarberDto: UpdateBarberDto): Promise<Barber>;
  remove(id: string): Promise<void>;
}
