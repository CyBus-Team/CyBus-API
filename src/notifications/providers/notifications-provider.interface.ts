import { NotificationDto } from "../dto"

export interface NotificationsProvider {
    setup(): Promise<void>
    teardown(): Promise<void>
    send(dto: NotificationDto): Promise<void>
}