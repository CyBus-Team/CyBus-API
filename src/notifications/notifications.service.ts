import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { NotificationsProvider } from './providers/notifications-provider.interface'
import { NOTIFICATION_PROVIDERS_KEY } from './constants/notification.constants'

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
    constructor(
        @Inject(NOTIFICATION_PROVIDERS_KEY)
        private readonly providers: NotificationsProvider[],
    ) { }

    async onModuleInit() {
        await this.setupAll()
    }

    async onModuleDestroy() {
        await this.teardownAll()
    }

    async setupAll() {
        for (const provider of this.providers) {
            await provider.setup()
        }
    }

    async teardownAll() {
        for (const provider of this.providers) {
            await provider.teardown()
        }
    }

    async send(message: string) {
        for (const provider of this.providers) {
            try {
                await provider.send(message)
                console.log(`Notification sent via ${provider.constructor.name}`)
            } catch (error) {
                console.error(`Failed to send notification via ${provider.constructor.name}:`, error)
            }
        }
    }
}
