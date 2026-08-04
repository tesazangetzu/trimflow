import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';

export interface IAppointmentService {
  create(dto: CreateAppointmentDto): Promise<Appointment>;
  findAll(barberId?: string, date?: string): Promise<Appointment[]>;
  findOne(id: string): Promise<Appointment>;
  findByBarberAndDateRange(barberId: string, start: Date, end: Date): Promise<Appointment[]>;
  update(id: string, dto: UpdateAppointmentDto): Promise<Appointment>;
  cancel(id: string): Promise<Appointment>;
  complete(id: string): Promise<Appointment>;
  remove(id: string): Promise<void>;
}
