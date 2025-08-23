import { Injectable } from '@nestjs/common'
import { GetTripDto, TripPatternDTO } from './dto'

@Injectable()
export class TripService {
  private readonly otpBaseUrl = process.env.OTP_BASE_URL ?? 'http://127.0.0.1:8080'

  async planTrip(dto: GetTripDto): Promise<TripPatternDTO[]> {
    try {
      const body = JSON.stringify({
        query: `query trip($accessEgressPenalty: [PenaltyForStreetMode!], $alightSlackDefault: Int, $alightSlackList: [TransportModeSlack], $arriveBy: Boolean, $banned: InputBanned, $bicycleOptimisationMethod: BicycleOptimisationMethod, $bikeSpeed: Float, $boardSlackDefault: Int, $boardSlackList: [TransportModeSlack], $bookingTime: DateTime, $dateTime: DateTime, $filters: [TripFilterInput!], $from: Location!, $ignoreRealtimeUpdates: Boolean, $includePlannedCancellations: Boolean, $includeRealtimeCancellations: Boolean, $itineraryFilters: ItineraryFilters, $locale: Locale, $maxAccessEgressDurationForMode: [StreetModeDurationInput!], $maxDirectDurationForMode: [StreetModeDurationInput!], $maximumAdditionalTransfers: Int, $maximumTransfers: Int, $modes: Modes, $numTripPatterns: Int, $pageCursor: String, $relaxTransitGroupPriority: RelaxCostInput, $searchWindow: Int, $timetableView: Boolean, $to: Location!, $transferPenalty: Int, $transferSlack: Int, $triangleFactors: TriangleFactors, $useBikeRentalAvailabilityInformation: Boolean, $via: [TripViaLocationInput!], $waitReluctance: Float, $walkReluctance: Float, $walkSpeed: Float, $wheelchairAccessible: Boolean, $whiteListed: InputWhiteListed) {
        trip(
          accessEgressPenalty: $accessEgressPenalty
          alightSlackDefault: $alightSlackDefault
          alightSlackList: $alightSlackList
          arriveBy: $arriveBy
          banned: $banned
          bicycleOptimisationMethod: $bicycleOptimisationMethod
          bikeSpeed: $bikeSpeed
          boardSlackDefault: $boardSlackDefault
          boardSlackList: $boardSlackList
          bookingTime: $bookingTime
          dateTime: $dateTime
          filters: $filters
          from: $from
          ignoreRealtimeUpdates: $ignoreRealtimeUpdates
          includePlannedCancellations: $includePlannedCancellations
          includeRealtimeCancellations: $includeRealtimeCancellations
          itineraryFilters: $itineraryFilters
          locale: $locale
          maxAccessEgressDurationForMode: $maxAccessEgressDurationForMode
          maxDirectDurationForMode: $maxDirectDurationForMode
          maximumAdditionalTransfers: $maximumAdditionalTransfers
          maximumTransfers: $maximumTransfers
          modes: $modes
          numTripPatterns: $numTripPatterns
          pageCursor: $pageCursor
          relaxTransitGroupPriority: $relaxTransitGroupPriority
          searchWindow: $searchWindow
          timetableView: $timetableView
          to: $to
          transferPenalty: $transferPenalty
          transferSlack: $transferSlack
          triangleFactors: $triangleFactors
          useBikeRentalAvailabilityInformation: $useBikeRentalAvailabilityInformation
          via: $via
          waitReluctance: $waitReluctance
          walkReluctance: $walkReluctance
          walkSpeed: $walkSpeed
          wheelchairAccessible: $wheelchairAccessible
          whiteListed: $whiteListed
        ) {
          previousPageCursor
          nextPageCursor
          tripPatterns {
            aimedStartTime
            aimedEndTime
            expectedEndTime
            expectedStartTime
            duration
            distance
            generalizedCost
            legs {
              id
              mode
              aimedStartTime
              aimedEndTime
              expectedEndTime
              expectedStartTime
              realtime
              distance
              duration
              generalizedCost
              fromPlace {
                name
                quay {
                  id
                }
              }
              toPlace {
                name
                quay {
                  id
                }
              }
              toEstimatedCall {
                destinationDisplay {
                  frontText
                }
              }
              line {
                publicCode
                name
                id
                presentation {
                  colour
                }
              }
              authority {
                name
                id
              }
              pointsOnLink {
                points
              }
              interchangeTo {
                staySeated
              }
              interchangeFrom {
                staySeated
              }
            }
            systemNotices {
              tag
            }
          }
        }
      }`,
        variables: {
          from: {
            coordinates: {
              latitude: dto.fromLatitude,
              longitude: dto.fromLongitude,
            }
          },
          to: {
            coordinates: {
              latitude: dto.toLatitude,
              longitude: dto.toLongitude,
            }
          },
          dateTime: dto.dateTime
        },
        operationName: 'trip'
      })

      console.log('[TripService] OTP request body:', body)
      const response = await fetch(`${this.otpBaseUrl}/transmodel/v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [TripService] OTP responded with HTTP ${response.status}: ${errorText}`)
        return []
      }

      const json = await response.json()
      return json?.data?.trip?.tripPatterns ?? []
    } catch (error) {
      console.log('[TripService] Failed to fetch tripPatterns from OTP:', error)
      return []
    }
  }
}
