import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { FeedbackDto } from './dto'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

@Injectable()
export class FeedbackService {
    constructor(private prisma: PrismaService) { }

    async create(dto: FeedbackDto) {
        try {
            // Save the feedback in the db
            const feedback = await this.prisma.feedback.create({
                data: {
                    message: dto.message,
                    rating: dto.rating,
                    email: dto.email,
                }
            })
            // Return the saved feedback
            return feedback
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                throw new InternalServerErrorException('Failed to save feedback')
            }
            throw error
        }
    }

}
