import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { BusesService } from './buses.service'
import { BusesController } from './buses.controller'

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule { }