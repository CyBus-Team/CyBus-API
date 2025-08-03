export type LatLonPoint = {
    lat: number
    lon: number
}

export type StopDto = {
    description: string          // Default description (usually localized)
    descriptionEl: string       // Description in Greek
    descriptionEn: string       // Description in English
    lat: number                  // Latitude of the stop
    lon: number                  // Longitude of the stop
}

export class RouteResultDto {
    constructor(
        stops: StopDto[],
        firstStop: StopDto,
        lastStop: StopDto,
        shape: LatLonPoint[],
    ) {
        this.stops = stops
        this.firstStop = firstStop
        this.lastStop = lastStop
        this.shape = shape
    }

    stops: StopDto[]                // Array of stop objects with names and coordinates
    firstStop: StopDto   // First stop of the route with name and coordinates
    lastStop: StopDto    // Last stop of the route with name and coordinates
    shape: LatLonPoint[]     // Polyline representing the route as array of coordinates
}