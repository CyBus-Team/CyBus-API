import { IsNotEmpty, IsString } from "class-validator"

export class NotificationDto {

    @IsString()
    @IsNotEmpty()
    message: string

    @IsString()
    @IsNotEmpty()
    provider: string
}