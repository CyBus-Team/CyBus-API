import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { FeedbackModule } from './feedback/feedback.module'
import { AutocompleteModule } from './autocomplete/autocomplete.module'
import { GeoModule } from './geo/geo.module'
import { BusesModule } from './buses/buses.module'
import { RoutesModule } from './routes/routes.module'
import { TripModule } from './trip/trip.module'
import { NotificationsModule } from './notifications/notifications.module'
import { MonitoringModule } from './monitoring/monitoring.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true // Makes the configuration available globally
    }),
    PrismaModule,
    FeedbackModule,
    AutocompleteModule,
    GeoModule,
    BusesModule,
    RoutesModule,
    TripModule,
    NotificationsModule,
    MonitoringModule
  ],
})
export class AppModule { }
