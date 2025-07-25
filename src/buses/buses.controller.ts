import { Controller, Get } from '@nestjs/common'
import { BusesService } from './buses.service'
import { BusesMetaResultDto, BusResultDto } from './dto'

@Controller('buses')
export class BusesController {
    constructor(private readonly busesService: BusesService) { }

    @Get()
    getBuses(): BusResultDto[] {
        return this.busesService.getCachedBuses()
    }

    @Get('meta')
    getMeta(): BusesMetaResultDto {
        return this.busesService.getMeta()
    }
}