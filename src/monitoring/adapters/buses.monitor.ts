import { Injectable } from '@nestjs/common'
import { MonitorableService, HealthCheckResult } from '../monitorable.interface'
import { BusesService } from 'src/buses/buses.service'

@Injectable()
export class BusesMonitor implements MonitorableService {
    readonly name = 'buses'

    constructor(private readonly service: BusesService) { }

    async check(): Promise<HealthCheckResult> {
        try {
            const meta = this.service.getMeta()
            if (meta.vehiclesCount === 0) {
                return new HealthCheckResult({ service: this.name, status: 'WARN', info: 'No vehicles in feed' })
            }
            const buses = this.service.getCachedBuses()
            if (buses.length === 0) {
                return new HealthCheckResult({ service: this.name, status: 'WARN', info: 'No buses in cache' })
            }
            return { service: this.name, status: 'OK' }
        } catch (e) {
            console.error(e)
            return new HealthCheckResult({ service: this.name, status: 'CRIT', info: e.message })
        }

    }
}