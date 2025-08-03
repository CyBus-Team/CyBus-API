import { Controller, Get, Query } from '@nestjs/common'
import { RouteResultDto, RoutesQueryDto } from './dto'
import { RoutesService } from './routes.service'

@Controller('routes')
export class RoutesController {
    constructor(private readonly service: RoutesService) { }

    @Get()
    getRoute(
        @Query() query: RoutesQueryDto,
    ): RouteResultDto {
        return this.service.getRouteByTrip(query)
    }
}
