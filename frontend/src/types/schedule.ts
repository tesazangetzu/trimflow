export interface Schedule {
  id: string
  barberId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateScheduleDto {
  barberId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive?: boolean
}

export interface UpdateScheduleDto {
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  isActive?: boolean
}

export interface AvailabilityBlock {
  id: string
  barberId: string
  startDateTime: string
  endDateTime: string
  reason?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateBlockDto {
  barberId: string
  startDateTime: string
  endDateTime: string
  reason?: string
}

export interface UpdateBlockDto {
  startDateTime?: string
  endDateTime?: string
  reason?: string
}
