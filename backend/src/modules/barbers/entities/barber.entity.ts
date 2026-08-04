import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Schedule } from '../../schedule/entities/schedule.entity';
import { AvailabilityBlock } from '../../schedule/entities/availability-block.entity';

@Entity('barbers')
export class Barber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ name: 'branchId' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @OneToMany(() => Appointment, appointment => appointment.barber)
  appointments: Appointment[];

  @OneToMany(() => Schedule, schedule => schedule.barber)
  schedules: Schedule[];

  @OneToMany(() => AvailabilityBlock, block => block.barber)
  availabilityBlocks: AvailabilityBlock[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
