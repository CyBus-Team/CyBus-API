export type HealthStatus = 'OK' | 'WARN' | 'CRIT'

export class HealthCheckResult {
    service: string
    status: HealthStatus
    info?: string

    constructor(partial?: Partial<HealthCheckResult>) {
        Object.assign(this, partial)
    }

    toString(): string {
        const emoji =
            this.status === 'OK'
                ? '✅'
                : this.status === 'WARN'
                    ? '⚠️'
                    : '❌'

        return `${this.service} : ${this.status} ${this.info ? ` - ${this.info}` : ''} ${emoji}`
    }
}

export interface MonitorableService {
    /** Human-readable name of the service */
    readonly name: string
    /** Performs availability/health check */
    check(): Promise<HealthCheckResult>
}