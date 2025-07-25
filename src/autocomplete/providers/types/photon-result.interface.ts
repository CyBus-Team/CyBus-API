export interface PhotonResult {
    features: {
        geometry: {
            coordinates: [number, number]
        }
        properties: {
            name: string
            street?: string
            city?: string
            country?: string
        }
    }[]
}