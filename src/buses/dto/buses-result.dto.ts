export class BusResultDto {
    vehicleId: string;    // Unique ID of the vehicle from GTFS
    routeId: string;      // Route ID from the GTFS trip
    label: string;        // Display label of the vehicle (e.g., bus number)
    latitude: number;     // Current latitude of the vehicle
    longitude: number;    // Current longitude of the vehicle
    timestamp: number;    // Timestamp of the last known vehicle position (Unix epoch)
}