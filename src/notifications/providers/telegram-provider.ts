import { Injectable } from "@nestjs/common"
import { NotificationsProvider } from "./notifications-provider.interface"
import { NotificationDto } from "../dto"
import TelegramBot from 'node-telegram-bot-api'
import { PrismaService } from "src/prisma/prisma.service"
import e from "express"

@Injectable()
export class TelegramProvider implements NotificationsProvider {

    constructor(private prisma: PrismaService) { }

    private bot!: TelegramBot

    async setup(): Promise<void> {
        const token = process.env.TELEGRAM_BOT_TOKEN!
        this.bot = new TelegramBot(token, { polling: true })
        this.bot.on('message', (msg) => {
            if (msg.text === '/start') {
                this.prisma.telegramChat.create({
                    data: {
                        chatId: msg.chat.id.toString()
                    }
                })
                this.bot.sendMessage(msg.chat.id, 'Subscribed to notifications ✅');
            } else if (msg.text === '/stop') {
                this.prisma.telegramChat.delete({
                    where: {
                        chatId: msg.chat.id.toString()
                    }
                })
                this.bot.sendMessage(msg.chat.id, 'Unsubscribed from notifications ❌');
            } else {
                this.bot.sendMessage(msg.chat.id, 'Unknown command. Use /start to subscribe and /stop to unsubscribe.');
            }
        })
    }

    async teardown(): Promise<void> {
        await this.bot.stopPolling()
        await this.bot.close()
    }

    async send(dto: NotificationDto): Promise<void> {
        for (const chat of await this.prisma.telegramChat.findMany()) {
            await this.bot.sendMessage(chat.chatId, dto.message)
        }
    }

}