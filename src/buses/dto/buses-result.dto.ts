export class BusResultDto {
    constructor(
        vehicleId: string,
        routeId: string,
        label: string,
        latitude: number,
        longitude: number,
        timestamp: number,
        shortLabel: string
    ) {
        this.vehicleId = vehicleId
        this.routeId = routeId
        this.label = label
        this.latitude = latitude
        this.longitude = longitude
        this.timestamp = timestamp
        this.shortLabel = shortLabel
    }

    vehicleId: string    // Unique ID of the vehicle from GTFS
    routeId: string      // Route ID from the GTFS trip
    label: string        // Display label of the vehicle (e.g., bus number)
    latitude: number     // Current latitude of the vehicle
    longitude: number    // Current longitude of the vehicle
    timestamp: number    // Timestamp of the last known vehicle position (Unix epoch)
    shortLabel: string   // Short route label (e.g. "7", "22", etc.)

}