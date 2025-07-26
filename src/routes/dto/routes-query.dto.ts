import { IsNotEmpty, IsString } from "class-validator"

export class RoutesQueryDto {

    // The GTFS trip ID to uniquely identify the trip
    @IsNotEmpty()
    @IsString()
    tripId: string

}