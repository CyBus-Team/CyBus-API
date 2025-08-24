export class AutocompleteResultDto {
    id: number                // ID of the result
    name: string              // Name of the place (e.g., "Lidl")
    address: string           // Full address (e.g., "Larnaca, Cyprus")
    lat: number               // Latitude
    lon: number               // Longitude
    source: string            // Source of the result (e.g., "nominatim")
}