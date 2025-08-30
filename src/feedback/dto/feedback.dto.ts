import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator"
import { Type } from "class-transformer"

export class FeedbackDto {

    @IsString()
    @IsNotEmpty()
    message: string

    @IsInt()
    @Min(1)
    @Max(5)
    @IsNotEmpty()
    @Type(() => Number)
    rating: number

    @IsOptional()
    email?: string
}