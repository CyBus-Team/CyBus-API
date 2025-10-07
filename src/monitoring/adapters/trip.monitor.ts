import { Injectable } from '@nestjs/common'
import { MonitorableService, HealthCheckResult } from '../monitorable.interface'
import { TripService } from 'src/trip/trip.service'
import { GetTripDto } from 'src/trip/dto'
import { MONITORING_TRIP_MODE } from '../constants/monitoring.constants'

@Injectable()
export class TripMonitor implements MonitorableService {
    readonly name = 'buses'

    constructor(private readonly service: TripService) { }

    async check(): Promise<HealthCheckResult> {
        try {
            const dto = new GetTripDto({
                fromLatitude: 34.68111,
                fromLongitude: 33.03338,
                toLatitude: 34.68123,
                toLongitude: 33.05478
            })
            const trip = await this.service.planTrip(dto)
            if (trip.length === 0) {
                return new HealthCheckResult({ service: this.name, status: 'CRIT', info: 'No trip data' })
            }

            const hasBus = trip.some(t => t.legs?.some(l => l.mode === MONITORING_TRIP_MODE))
            if (!hasBus) {
                return new HealthCheckResult({ service: this.name, status: 'CRIT', info: 'No bus leg found' })
            }
            return new HealthCheckResult({ service: this.name, status: 'OK' })
        } catch (e) {
            console.error(e)
            return new HealthCheckResult({ service: this.name, status: 'CRIT', info: e.message })
        }

    }
}