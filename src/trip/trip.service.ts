import { Injectable } from '@nestjs/common'
import { GetTripDto, TripPatternDTO } from './dto'

@Injectable()
export class TripService {
  private readonly otpBaseUrl = process.env.OTP_BASE_URL ?? 'http://127.0.0.1:8080'

  async planTrip(dto: GetTripDto): Promise<TripPatternDTO[]> {
    const query = `query trip($accessEgressPenalty: [PenaltyForStreetMode!], $alightSlackDefault: Int, $alightSlackList: [TransportModeSlack], $arriveBy: Boolean, $banned: InputBanned, $bicycleOptimisationMethod: BicycleOptimisationMethod, $bikeSpeed: Float, $boardSlackDefault: Int, $boardSlackList: [TransportModeSlack], $filters: [TripFilterInput!], $from: Location!, $ignoreRealtimeUpdates: Boolean, $includePlannedCancellations: Boolean, $includeRealtimeCancellations: Boolean, $itineraryFilters: ItineraryFilters, $locale: Locale, $maxAccessEgressDurationForMode: [StreetModeDurationInput!], $maxDirectDurationForMode: [StreetModeDurationInput!], $maximumAdditionalTransfers: Int, $maximumTransfers: Int, $modes: Modes, $numTripPatterns: Int, $pageCursor: String, $relaxTransitGroupPriority: RelaxCostInput, $searchWindow: Int, $timetableView: Boolean, $to: Location!, $transferPenalty: Int, $transferSlack: Int, $triangleFactors: TriangleFactors, $useBikeRentalAvailabilityInformation: Boolean, $via: [TripViaLocationInput!], $waitReluctance: Float, $walkReluctance: Float, $walkSpeed: Float, $wheelchairAccessible: Boolean, $whiteListed: InputWhiteListed) {
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
        fromPlace { name quay { id } }
        toPlace { name quay { id } }
        toEstimatedCall { destinationDisplay { frontText } }
        line { publicCode name id presentation { colour } }
        authority { name id }
        pointsOnLink { points }
        interchangeTo { staySeated }
        interchangeFrom { staySeated }
      }
      systemNotices { tag }
    }
  }
}`

    let pageCursor: string | null = null;
    const maxPages = 5;
    const MAX_RESULTS = 5;
    const all: TripPatternDTO[] = [];

    for (let page = 1; page <= maxPages; page++) {
      console.log(`[TripService] Fetching page ${page} with cursor: ${pageCursor}`);
      const body = JSON.stringify({
        query,
        variables: {
          from: { coordinates: { latitude: dto.fromLatitude, longitude: dto.fromLongitude } },
          to: { coordinates: { latitude: dto.toLatitude, longitude: dto.toLongitude } },
          pageCursor,
          numTripPatterns: MAX_RESULTS,
        },
        operationName: 'trip',
      });

      try {
        const response = await fetch(`${this.otpBaseUrl}/otp/transmodel/v3`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [TripService] OTP responded with HTTP ${response.status}: ${errorText}`);
          break;
        }

        const json = await response.json();
        const tripData = json?.data?.trip;
        if (!tripData) {
          console.log('[TripService] No trip data returned, stopping.');
          break;
        }

        const pagePatterns: TripPatternDTO[] = tripData.tripPatterns ?? [];
        // Backend normalization: force line.presentation to be an empty string for iOS decoder compatibility
        pagePatterns.forEach(pattern => {
          if (!pattern?.legs) return;
          pattern.legs.forEach(leg => {
            if (leg && (leg as any).line) {
              (leg as any).line.presentation = "";
            }
          });
        });
        if (pagePatterns.length) {
          console.log(`[TripService] Retrieved ${pagePatterns.length} tripPatterns on this page.`);
          all.push(...pagePatterns);
          if (all.length >= MAX_RESULTS) {
            console.log(`[TripService] Reached MAX_RESULTS (${MAX_RESULTS}). Returning early.`);
            return all.slice(0, MAX_RESULTS);
          }
        }

        pageCursor = tripData.nextPageCursor;
        if (!pageCursor) {
          console.log('[TripService] No nextPageCursor, reached last page.');
          break;
        }
      } catch (error) {
        console.log('[TripService] Failed to fetch tripPatterns from OTP:', error);
        break;
      }
    }

    console.log(`[TripService] Accumulated ${all.length} tripPatterns over all pages.`);
    return all.slice(0, MAX_RESULTS);
  }
}
