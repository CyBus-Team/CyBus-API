import { Controller, Get } from '@nestjs/common'
import { BusesService } from './buses.service'

@Controller('buses')
export class BusesController {
    constructor(private readonly busesService: BusesService) { }

    @Get()
    getVehicles() {
        return this.busesService.getCachedVehicles()
    }

    @Get('meta')
    getMeta() {
        return {
            updatedAt: this.busesService.getLastUpdated(),
            vehiclesCount: this.busesService.getCachedVehicles().length,
        }
    }
}