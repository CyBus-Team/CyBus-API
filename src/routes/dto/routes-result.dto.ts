export type LatLonPoint = {
    lat: number
    lon: number
}

export class RouteResultDto {
    constructor(
        stops: GeoJSON.Point[],
        shape: LatLonPoint[] | null,
        firstStop: LatLonPoint | null,
        lastStop: LatLonPoint | null
    ) {
        this.stops = stops
        this.shape = shape
        this.firstStop = firstStop
        this.lastStop = lastStop
    }

    stops: GeoJSON.Point[]           // Array of stop coordinates
    shape: LatLonPoint[] | null // Array of coordinate objects representing the route polyline
    firstStop: LatLonPoint | null    // First stop as coordinate object
    lastStop: LatLonPoint | null     // Last stop as coordinate object
}