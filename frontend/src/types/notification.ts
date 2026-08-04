export type NotificationChannel = "email" | "whatsapp"
export type NotificationStatus = "pending" | "sent" | "failed"

export interface Notification {
  id: string
  channel: NotificationChannel
  recipient: string
  subject: string
  content: string
  status: NotificationStatus
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateNotificationDto {
  channel: NotificationChannel
  recipient: string
  subject: string
  content: string
  metadata?: Record<string, unknown>
}
