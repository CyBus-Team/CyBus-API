import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { TelegramProvider } from './providers/telegram-provider'
import { NOTIFICATION_PROVIDERS_KEY } from './constants/notification.constants'
import { NotificationsProvider } from './providers/notifications-provider.interface'

@Module({
  providers: [
    NotificationsService,
    TelegramProvider,
    {
      provide: NOTIFICATION_PROVIDERS_KEY,
      useFactory: (telegram: TelegramProvider): NotificationsProvider[] => [telegram],
      inject: [TelegramProvider],
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule { }
