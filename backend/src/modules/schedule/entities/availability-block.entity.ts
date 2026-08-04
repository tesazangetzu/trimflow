import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Barber } from '../../barbers/entities/barber.entity';

@Entity('availability_blocks')
export class AvailabilityBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'barberId' })
  barberId: string;

  @ManyToOne(() => Barber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barberId' })
  barber: Barber;

  @Column({ type: 'timestamptz' })
  startDateTime: Date;

  @Column({ type: 'timestamptz' })
  endDateTime: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
