import { IsNotEmpty, IsString } from "class-validator"

export class RoutesQueryDto {

    // The name of the route line (e.g., "17")
    @IsNotEmpty()
    @IsString()
    lineName: string

    // The GTFS trip ID to uniquely identify the trip
    @IsNotEmpty()
    @IsString()
    tripId: string

}