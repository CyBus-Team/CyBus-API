import { Inject, Injectable } from '@nestjs/common';
import { NotificationsProvider } from './providers/notifications-provider.interface';
import { NOTIFICATION_PROVIDERS_KEY } from './constants/notification.constants';

@Injectable()
export class NotificationsService {
    constructor(
        @Inject(NOTIFICATION_PROVIDERS_KEY)
        private readonly providers: NotificationsProvider[],
    ) { }

    async setupAll() {
        for (const provider of this.providers) {
            await provider.setup();
        }
    }

    async teardownAll() {
        for (const provider of this.providers) {
            await provider.teardown();
        }
    }

    async sendNotification(dto: any) {
        for (const provider of this.providers) {
            try {
                await provider.send(dto);
                console.log(`Notification sent via ${provider.constructor.name}`);
                return; // Exit after the first successful send
            } catch (error) {
                console.error(`Failed to send notification via ${provider.constructor.name}:`, error);
            }
        }
    }

}
