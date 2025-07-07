import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { GeoTask } from './geo.task'
import { GeoService } from './geo.service'

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [GeoService, GeoTask],
})
export class GeoModule { }