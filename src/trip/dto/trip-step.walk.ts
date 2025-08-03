import { TripStepResultBase } from "./trip-step-result.dto"

export interface WalkStep extends TripStepResultBase {
    type: 'walk'
    from: [number, number]
    to: [number, number]
    path: [number, number][]
}