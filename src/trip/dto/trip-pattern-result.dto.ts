export interface AuthorityDTO {
    id: string
    name: string
}

export interface EstimatedCallDTO {
    destinationDisplay?: {
        frontText: string
    }
}

export interface LegDTO {
    aimedEndTime: string
    aimedStartTime: string
    anticipatedStartTime?: string
    distance: number
    duration: number
    expectedEndTime: string
    expectedStartTime: string
    generalizedCost: number
    id: string | null
    interchangeFrom: null
    interchangeTo: null
    line: LineDTO | null
    mode: string
    authority: AuthorityDTO | null
    pointsOnLink?: {
        points: string
    }
    fromPlace: PlaceDTO
    realtime: boolean
    toEstimatedCall: EstimatedCallDTO | null
    toPlace: PlaceDTO
}

export interface LineDTO {
    id: string
    name: string
    presentation?: {
        colour?: string
    }
    publicCode: string
}

export interface PlaceDTO {
    name: string
    quay: {
        id: string
    } | null
}

export interface TripPatternDTO {
    aimedEndTime: string
    aimedStartTime: string
    distance: number
    duration: number
    expectedEndTime: string
    expectedStartTime: string
    generalizedCost: number
    legs: LegDTO[]
    systemNotices: any[]
}