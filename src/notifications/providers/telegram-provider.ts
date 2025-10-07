import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common"
import { NotificationsProvider } from "./notifications-provider.interface"
import TelegramBot = require('node-telegram-bot-api')
import { PrismaService } from "src/prisma/prisma.service"

@Injectable()
export class TelegramProvider implements NotificationsProvider {

    constructor(private prisma: PrismaService) { }

    private bot!: TelegramBot

    async setup(): Promise<void> {
        if (this.bot) return // idempotent
        const token = process.env.TELEGRAM_BOT_TOKEN!
        this.bot = new TelegramBot(token, { polling: true })

        this.bot.on('message', async (msg) => {
            if (msg.text === '/start') {
                await this.prisma.telegramChat.create({
                    data: { chatId: msg.chat.id.toString() }
                }).catch(() => { }) // ignore duplicates if unique
                await this.bot.sendMessage(msg.chat.id, 'Subscribed to notifications ✅')
            } else if (msg.text === '/stop') {
                await this.prisma.telegramChat.delete({
                    where: { chatId: msg.chat.id.toString() }
                }).catch(() => { }) // ignore if not found
                await this.bot.sendMessage(msg.chat.id, 'Unsubscribed from notifications ❌')
            } else {
                await this.bot.sendMessage(msg.chat.id, 'Unknown command. Use /start to subscribe and /stop to unsubscribe.')
            }
        })
    }

    async teardown(): Promise<void> {
        if (!this.bot) return
        await this.bot.stopPolling().catch(() => { })
        await this.bot.close().catch(() => { })
        this.bot = undefined as any
    }

    async send(message: string): Promise<void> {
        if (!this.bot) await this.setup()
        for (const chat of await this.prisma.telegramChat.findMany()) {
            await this.bot?.sendMessage(chat.chatId, message)
        }
    }

}