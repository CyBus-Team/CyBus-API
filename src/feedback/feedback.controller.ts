import { Body, Controller, Post } from '@nestjs/common'
import { FeedbackService } from './feedback.service'
import { FeedbackDto } from './dto'

@Controller('feedback')
export class FeedbackController {
    constructor(private service: FeedbackService) { }

    @Post()
    create(@Body() dto: FeedbackDto) {
        return this.service.create(dto)
    }
}
