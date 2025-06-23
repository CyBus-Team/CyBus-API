import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient {
    constructor(config: ConfigService) {
        super({
            datasources: {
                db: {
                    url: config.get('DATABASE_URL') //'postgresql://postgres:123@localhost:5434/cybus?schema=public'
                }
            }
        })
    }

    async onModuleInit() {
        await this.$connect()
    }

    async onModuleDestroy() {
        await this.$disconnect()
    }

    cleanDb() {
        return this.$transaction([
            this.bookmark.deleteMany(),
            this.user.deleteMany(),
            this.feedback.deleteMany(),
        ])
    }
}
