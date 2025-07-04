import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async editUser(
        userId: number,
        dto: EditUserDto,
    ) {
        console.log('Editing user with ID:', userId);
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...dto,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                firstName: true,
                lastName: true,
            }
        })

        return user
    }
}
