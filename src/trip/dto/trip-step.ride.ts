import { TripStepResultBase } from "./trip-step-result.dto"

export interface RideStep extends TripStepResultBase {
    type: 'ride'
    fromStopId: string
    toStopId: string
    lineName: string
    tripId: string
    stopsCount: number
}