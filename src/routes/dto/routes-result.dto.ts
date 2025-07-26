export class RouteResultDto {
    constructor(
        stops: GeoJSON.Point[],
        shape: GeoJSON.LineString | null,
        firstStop: GeoJSON.Point | null,
        lastStop: GeoJSON.Point | null
    ) {
        this.stops = stops
        this.shape = shape
        this.firstStop = firstStop
        this.lastStop = lastStop
    }

    stops: GeoJSON.Point[]           // Array of stop coordinates
    shape: GeoJSON.LineString | null // Route polyline
    firstStop: GeoJSON.Point | null  // First stop of the route
    lastStop: GeoJSON.Point | null   // Last stop of the route
}