import { Inject, Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { MONITORING_PROVIDERS_KEY } from './constants/monitoring.constants'
import { MonitorableService } from './monitorable.interface'
import { NotificationsService } from 'src/notifications/notifications.service'

@Injectable()
export class MonitoringService {

    constructor(
        @Inject(MONITORING_PROVIDERS_KEY)
        private readonly services: MonitorableService[],
        private readonly notifications: NotificationsService
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async hourly() {
        for (const service of this.services) {
            try {
                const check = await service.check()
                const message = `Health check for ${check.toString()}`
                console.log(message)
            } catch (err) {
                const message = `Health check for ${service.name} failed: ${err} ❌ `
                console.error(message)
                await this.notifications.send(message)
            }
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_1PM)
    async daily() {
        const results: Array<String> = []
        for (const service of this.services) {
            try {
                const check = await service.check()
                const message = `Daily health check for ${check.toString()}`
                console.log(message)
                results.push(message)
            } catch (err) {
                const message = `Daily health check for ${service.name}: ${err} ❌ `
                console.error(message)
                results.push(message)
            }
        }
        const message = `📋 Daily Health Check Report:\n` + results.join('\n')
        await this.notifications.send(message)
    }

}
