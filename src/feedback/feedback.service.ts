import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedbackDto } from './dto';

@Injectable()
export class FeedbackService {
    constructor(private prisma: PrismaService) { }
    create(dto: FeedbackDto) {
        return { msg: 'Create feedback' }
    }
}
