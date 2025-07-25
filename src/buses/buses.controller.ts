import { Controller, Get } from '@nestjs/common'
import { BusesService } from './buses.service'
import { BusesMetaResultDto, BusResultDto } from './dto'

@Controller('buses')
export class BusesController {
    constructor(private readonly busesService: BusesService) { }

    @Get()
    getVehicles(): BusResultDto[] {
        return this.busesService.getCachedVehicles()
    }

    @Get('meta')
    getMeta(): BusesMetaResultDto {
        return this.busesService.getMeta()
    }
}