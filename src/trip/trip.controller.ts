import { Controller, Get, Query } from '@nestjs/common'
import { TripService } from './trip.service'
import { GetTripDto, TripStep } from './dto'

@Controller('trip')
export class TripController {
    constructor(private readonly service: TripService) { }

    @Get()
    async getTrip(@Query() query: GetTripDto): Promise<TripStep[]> {
        return this.service.planTrip(query)
    }
}