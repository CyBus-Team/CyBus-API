import { Type } from 'class-transformer';
import { IsNumber, IsISO8601, IsDefined } from 'class-validator';

export class GetTripDto {
    @Type(() => Number)
    @IsNumber()
    fromLatitude: number;

    @Type(() => Number)
    @IsNumber()
    fromLongitude: number;

    @Type(() => Number)
    @IsNumber()
    toLatitude: number;

    @Type(() => Number)
    @IsNumber()
    toLongitude: number;

    @IsISO8601()
    dateTime: string;
}