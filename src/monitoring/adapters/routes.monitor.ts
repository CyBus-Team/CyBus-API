import { Injectable } from '@nestjs/common'
import { MonitorableService, HealthCheckResult } from '../monitorable.interface'
import { RoutesService } from 'src/routes/routes.service'
import { RoutesQueryDto } from 'src/routes/dto'
import { MONITORING_TRIP_ID } from '../constants/monitoring.constants'

@Injectable()
export class RoutesMonitor implements MonitorableService {
    readonly name = 'routes'

    constructor(private readonly service: RoutesService) { }

    async check(): Promise<HealthCheckResult> {
        try {
            const tripId = MONITORING_TRIP_ID
            const dto = new RoutesQueryDto({ tripId: tripId })
            this.service.getRouteByTrip(dto)
            return new HealthCheckResult({ service: this.name, status: 'OK' })
        } catch (e) {
            console.error(e)
            return new HealthCheckResult({ service: this.name, status: 'CRIT', info: e.message })
        }
    }
}