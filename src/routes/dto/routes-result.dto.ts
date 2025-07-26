export type LatLonPoint = {
    lat: number
    lon: number
}

export class RouteResultDto {
    constructor(
        stops: GeoJSON.Point[],
        firstStop: LatLonPoint | null,
        lastStop: LatLonPoint | null,
        shape: LatLonPoint[] | null,
    ) {
        this.stops = stops
        this.firstStop = firstStop
        this.lastStop = lastStop
        this.shape = shape
    }

    stops: GeoJSON.Point[]           // Array of stop coordinates
    firstStop: LatLonPoint | null    // First stop as coordinate object
    lastStop: LatLonPoint | null     // Last stop as coordinate object
    shape: LatLonPoint[] | null // Array of coordinate objects representing the route polyline
}