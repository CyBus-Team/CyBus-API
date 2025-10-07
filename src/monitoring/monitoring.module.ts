import { Module } from '@nestjs/common'
import { MonitoringService } from './monitoring.service'
import { BusesMonitor } from './adapters/buses.monitor'
import { RoutesMonitor } from './adapters/routes.monitor'
import { TripMonitor } from './adapters/trip.monitor'
import { AutocompleteMonitor } from './adapters/autocomplete.monitor'
import { MonitorableService } from './monitorable.interface'
import { MONITORING_PROVIDERS_KEY } from './constants/monitoring.constants'
import { AutocompleteModule } from 'src/autocomplete/autocomplete.module'
import { BusesModule } from 'src/buses/buses.module'
import { RoutesModule } from 'src/routes/routes.module'
import { TripModule } from 'src/trip/trip.module'
import { NotificationsModule } from 'src/notifications/notifications.module'

@Module({
  imports: [
    NotificationsModule,
    AutocompleteModule,
    BusesModule,
    RoutesModule,
    TripModule,
  ],
  providers: [
    MonitoringService,
    AutocompleteMonitor,
    BusesMonitor,
    RoutesMonitor,
    TripMonitor,
    {
      provide: MONITORING_PROVIDERS_KEY,
      useFactory: (
        autocomplete: AutocompleteMonitor,
        buses: BusesMonitor,
        routes: RoutesMonitor,
        trip: TripMonitor,
      ): MonitorableService[] => [autocomplete, buses, routes, trip],
      inject: [AutocompleteMonitor, BusesMonitor, RoutesMonitor, TripMonitor],
    }
  ],
})
export class MonitoringModule { }
