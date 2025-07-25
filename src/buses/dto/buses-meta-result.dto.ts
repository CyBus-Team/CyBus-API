export class BusesMetaResultDto {
    updatedAt: string       // ISO timestamp indicating the last time the GTFS data was updated
    vehiclesCount: number   // Total number of active vehicle positions available in the cache
}