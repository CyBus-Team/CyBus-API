import { Injectable } from '@nestjs/common'
import { MonitorableService, HealthCheckResult } from '../monitorable.interface'
import { AutocompleteService } from 'src/autocomplete/autocomplete.service'
import { AutocompleteQueryDto } from 'src/autocomplete/dto'
import { MONITORING_QUERY } from '../constants/monitoring.constants'

@Injectable()
export class AutocompleteMonitor implements MonitorableService {
    readonly name = 'autocomplete'

    constructor(private readonly service: AutocompleteService) { }

    async check(): Promise<HealthCheckResult> {
        try {
            const q = MONITORING_QUERY
            const dto = new AutocompleteQueryDto({ q: q })
            const result = await this.service.search(dto)
            if (result.length === 0) {
                return new HealthCheckResult({ service: this.name, status: 'CRIT', info: `No search results for q = ${q}` })
            }
            return new HealthCheckResult({ service: this.name, status: 'OK' })
        } catch (e) {
            console.error(e)
            return new HealthCheckResult({ service: this.name, status: 'CRIT', info: e.message })
        }
    }
}