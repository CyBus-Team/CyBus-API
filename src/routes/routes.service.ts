import { Injectable, NotFoundException } from '@nestjs/common'
import { RouteResultDto, RoutesQueryDto, StopDto } from './dto'
import { LatLonPoint } from './dto'
import { join } from 'path'
import { readFileSync } from 'fs'
import { Feature, LineString, Point } from 'geojson'

@Injectable()
export class RoutesService {

    getRouteByTrip(dto: RoutesQueryDto): RouteResultDto {
        const filePath = join(process.cwd(), 'data', 'geojson', 'routes.geojson')
        const raw = readFileSync(filePath, 'utf-8')
        const json = JSON.parse(raw)
        const features = json.features || []

        // Step 1: Find matching features by LINE_ID
        const matching = features.filter(f =>
            f.properties?.LINE_ID === dto.tripId
        )
        if (matching.length === 0) {
            throw new NotFoundException(`No route found for LINE_ID: ${dto.tripId}`)
        }

        // Step 2: Extract shape (LineString) from route feature
        let shape: LatLonPoint[] = []
        for (const feature of matching) {
            if (feature.geometry.type === 'LineString') {
                shape = (feature.geometry as LineString).coordinates.map(
                    ([lon, lat]): LatLonPoint => ({ lat, lon })
                )
            }
        }

        // Step 3: Resolve stops using GTFS: stop_times.json and stops.json
        const stopTimesPath = join(process.cwd(), 'data', 'gtfs', 'stop_times.json')
        const stopsPath = join(process.cwd(), 'data', 'gtfs', 'stops.json')

        const stopTimesRaw = readFileSync(stopTimesPath, 'utf-8')
        const stopsRaw = readFileSync(stopsPath, 'utf-8')

        const stopTimes = JSON.parse(stopTimesRaw)
        const allStops = JSON.parse(stopsRaw)

        const tripIds = new Set(
            features
                .map(f => f.properties?.LINE_ID)
                .filter(Boolean)
        )

        console.log(`Found ${tripIds.size} trip IDs for LINE_ID: ${dto.tripId}`)

        const stopIds = stopTimes
            .filter((record: any) => tripIds.has(record.trip_id))
            .map((record: any) => record.stop_id)

        const seen = new Set<string>()
        const uniqueStopIds = stopIds.filter(id => {
            if (seen.has(id)) return false
            seen.add(id)
            return true
        })

        const stops: StopDto[] = uniqueStopIds
            .map((id: string) => allStops.find((s: any) => s.stop_id === id))
            .filter(Boolean)
            .map((s: any) => ({
                description: s.stop_name ?? '',
                lat: parseFloat(s.stop_lat),
                lon: parseFloat(s.stop_lon),
            } satisfies StopDto))

        if (stops.length === 0) {
            throw new NotFoundException(`No stops found for LINE_ID: ${dto.tripId}`)
        }

        const firstStop = stops[0]
        const lastStop = stops[stops.length - 1]

        return new RouteResultDto(stops, firstStop, lastStop, shape)
    }
}