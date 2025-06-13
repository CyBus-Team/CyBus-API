import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator"

export class FeedbackDto {

    @IsString()
    @IsNotEmpty()
    message: string

    @IsInt()
    @Min(1)
    @Max(5)
    @IsNotEmpty()
    stars: number

    @IsEmail()
    @IsOptional()
    email?: string
}