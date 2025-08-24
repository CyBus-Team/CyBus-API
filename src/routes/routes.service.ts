import { Injectable, NotFoundException } from '@nestjs/common'
import { RouteResultDto, RoutesQueryDto, StopDto, LatLonPoint } from './dto'
import { join } from 'path'
import { readFileSync } from 'fs'

@Injectable()
export class RoutesService {

    getRouteByTrip(dto: RoutesQueryDto): RouteResultDto {
        // We mirror the iOS logic:
        // 1) pick a single GTFS trip by route_id
        // 2) get stop_times only for that trip, sorted by stop_sequence
        // 3) map to stops in the same order
        // 4) build shape from GTFS shapes by trip.shape_id (sorted by shape_pt_sequence)

        // Treat dto.tripId as routeId (to match the mobile function signature)
        const routeId = dto.tripId

        const gtfsDir = join(process.cwd(), 'data', 'gtfs')
        const tripsPath = join(gtfsDir, 'trips.json')
        const stopTimesPath = join(gtfsDir, 'stop_times.json')
        const stopsPath = join(gtfsDir, 'stops.json')
        const shapesPath = join(gtfsDir, 'shapes.json')

        const trips = JSON.parse(readFileSync(tripsPath, 'utf-8'))
        const stopTimes = JSON.parse(readFileSync(stopTimesPath, 'utf-8'))
        const allStops = JSON.parse(readFileSync(stopsPath, 'utf-8'))
        const allShapes = JSON.parse(readFileSync(shapesPath, 'utf-8'))
        // Load routes.geojson for routeNumber lookup
        const geojsonPath = join(process.cwd(), 'data', 'geojson', 'routes.geojson')
        const routesGeojson = JSON.parse(readFileSync(geojsonPath, 'utf-8'))

        // 1) Find one trip by route_id (similar to: trips.first { $0.routeId == routeID })
        const trip = trips.find((t: any) => String(t.route_id) === String(routeId))
        if (!trip) {
            throw new NotFoundException(`No GTFS trip found for route_id: ${routeId}`)
        }

        // 2) stop_times for that trip, sorted by stop_sequence
        const stForTrip = stopTimes
            .filter((st: any) => String(st.trip_id) === String(trip.trip_id))
            .sort((a: any, b: any) => Number(a.stop_sequence) - Number(b.stop_sequence))

        if (stForTrip.length === 0) {
            throw new NotFoundException(`No stop_times for trip_id: ${trip.trip_id}`)
        }

        // 3) Resolve stops in the same order
        const stops: StopDto[] = stForTrip
            .map((st: any) => allStops.find((s: any) => String(s.stop_id) === String(st.stop_id)))
            .filter(Boolean)
            .map((s: any) => ({
                description: s.stop_name ?? '',
                lat: parseFloat(s.stop_lat),
                lon: parseFloat(s.stop_lon),
            } as StopDto))

        if (stops.length === 0) {
            throw new NotFoundException(`No stops resolved for trip_id: ${trip.trip_id}`)
        }

        const firstStop = stops[0]
        const lastStop = stops[stops.length - 1]

        // 4) Build shape from GTFS shapes by shape_id (sorted by shape_pt_sequence)
        const shapePoints = allShapes
            .filter((p: any) => String(p.shape_id) === String(trip.shape_id))
            .sort((a: any, b: any) => Number(a.shape_pt_sequence) - Number(b.shape_pt_sequence))

        const shape: LatLonPoint[] = shapePoints.map((p: any) => ({
            lat: parseFloat(p.shape_pt_lat),
            lon: parseFloat(p.shape_pt_lon),
        }))

        // Route meta (best effort): use GTFS fields if available
        const routeName = (trip.trip_headsign ?? trip.trip_short_name ?? '').toString() || 'Unknown Route'
        // Look up routeNumber from routes.geojson
        let routeNumber = "N/A"
        if (Array.isArray(routesGeojson.features)) {
            const found = routesGeojson.features.find(
                (f: any) => f?.properties?.LINE_ID == trip.route_id
            )
            if (found && found.properties && typeof found.properties.LINE_NAME !== "undefined") {
                routeNumber = found.properties.LINE_NAME
            }
        }

        // Times are not per-day specific here; if you need exact departure/arrival for a specific service date,
        // you should derive from stop_times (first/last arrival/departure). As a placeholder, we expose first/last times.
        const rawDeparture = (stForTrip[0]?.departure_time ?? stForTrip[0]?.arrival_time ?? 'N/A').toString()
        const rawArrival = (stForTrip[stForTrip.length - 1]?.arrival_time ?? stForTrip[stForTrip.length - 1]?.departure_time ?? 'N/A').toString()

        const departureTime = rawDeparture.split(':').slice(0, 2).join(':')
        const arrivalTime = rawArrival.split(':').slice(0, 2).join(':')

        return new RouteResultDto(stops, firstStop, lastStop, shape, routeName, routeNumber, arrivalTime, departureTime)
    }
}