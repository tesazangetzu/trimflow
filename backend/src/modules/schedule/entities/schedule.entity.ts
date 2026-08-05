import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Barber } from '../../barbers/entities/barber.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'barberId' })
  barberId: string;

  @ManyToOne(() => Barber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barberId' })
  barber: Barber;

  @Column({ type: 'smallint' })
  dayOfWeek: number;

  @Column({ type: 'time without time zone' })
  startTime: string;

  @Column({ type: 'time without time zone' })
  endTime: string;

  @Column({ type: 'time without time zone', nullable: true })
  breakStartTime?: string;

  @Column({ type: 'time without time zone', nullable: true })
  breakEndTime?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
