export interface NotificationsProvider {
    setup(): Promise<void>
    teardown(): Promise<void>
    send(message: string): Promise<void>
}