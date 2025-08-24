export interface PhotonResult {
    features: {
        geometry: {
            coordinates: [number, number]
        }
        properties: {
            osm_id: number
            name: string
            street?: string
            city?: string
            country?: string
        }
    }[]
}