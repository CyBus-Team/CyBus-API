export type LatLonPoint = {
    lat: number
    lon: number
}

export type StopDto = {
    description: string          // Default description (usually localized)
    lat: number                  // Latitude of the stop
    lon: number                  // Longitude of the stop
}

export class RouteResultDto {
    constructor(
        stops: StopDto[],
        firstStop: StopDto,
        lastStop: StopDto,
        shape: LatLonPoint[],
        routeName: string,
        routeNumber: string,
        arrivalTime: string,
        departureTime: string,

    ) {
        this.stops = stops
        this.firstStop = firstStop
        this.lastStop = lastStop
        this.shape = shape
        this.routeName = routeName
        this.arrivalTime = arrivalTime
        this.departureTime = departureTime
        this.routeNumber = routeNumber
    }

    stops: StopDto[]                // Array of stop objects with names and coordinates
    firstStop: StopDto   // First stop of the route with name and coordinates
    lastStop: StopDto    // Last stop of the route with name and coordinates
    shape: LatLonPoint[]     // Polyline representing the route as array of coordinates
    routeName: string              // Name of the route
    arrivalTime: string           // Arrival time at the first stop
    departureTime: string         // Departure time from the last stop
    routeNumber: string            // Number or code of the route
}