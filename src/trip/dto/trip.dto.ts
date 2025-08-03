import { IsNumber } from 'class-validator'

export class GetTripDto {
    @IsNumber()
    fromLat: number

    @IsNumber()
    fromLng: number

    @IsNumber()
    toLat: number

    @IsNumber()
    toLng: number
}