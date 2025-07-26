export class RouteResultDto {
    constructor(stops: GeoJSON.Point[], shape: GeoJSON.LineString | null) {
        this.stops = stops
        this.shape = shape
    }

    stops: GeoJSON.Point[]           // Array of stop coordinates
    shape: GeoJSON.LineString | null // Route polyline
}