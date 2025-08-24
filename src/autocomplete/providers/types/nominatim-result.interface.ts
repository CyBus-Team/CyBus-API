export interface NominatimResult {
    place_id: number
    display_name: string
    lat: string
    lon: string
    address: {
        road?: string
        city?: string
        town?: string
        village?: string
        country?: string
    }
}