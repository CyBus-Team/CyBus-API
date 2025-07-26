import { Injectable, NotFoundException } from '@nestjs/common'
import { RouteResultDto, RoutesQueryDto, StopDto } from './dto'
import { FeatureCollection } from 'geojson'
import { LatLonPoint } from './dto'
import { join } from 'path'
import { readFileSync } from 'fs'
import { Feature, LineString, Point } from 'geojson'

@Injectable()
export class RoutesService {
    private readonly features: Feature[] = []
    private readonly stopsFeatures: Feature[] = []

    constructor() {
        try {
            const filePath = join(process.cwd(), 'data', 'geojson', 'routes.geojson')
            const raw = readFileSync(filePath, 'utf-8')
            const json = JSON.parse(raw)
            this.features = json.features || []
            const stopsPath = join(process.cwd(), 'data', 'geojson', 'stops.geojson')
            const stopsRaw = readFileSync(stopsPath, 'utf-8')
            const stopsJson: FeatureCollection = JSON.parse(stopsRaw)
            this.stopsFeatures = stopsJson.features || []
        } catch (error) {
            throw error
        }
    }

    getRouteByTrip(dto: RoutesQueryDto): RouteResultDto {
        const matching = this.features.filter(f =>
            f.properties?.LINE_ID === dto.tripId
        )
        if (matching.length === 0) {
            throw new NotFoundException(`No route found for tripId: ${dto.tripId}`)
        }

        const stopIds = matching[0]?.properties?.STOPS?.split(',') || []
        const stops: StopDto[] = this.stopsFeatures
            .filter((f): f is Feature<Point> => stopIds.includes(f.properties?.code))
            .map(f => {
                const props = f.properties || {}
                const [lon, lat] = f.geometry.coordinates
                return {
                    description: props.description ?? '',
                    descriptionEl: props['description[el]'] ?? '',
                    descriptionEn: props['description[en]'] ?? '',
                    lat,
                    lon,
                } satisfies StopDto
            })
        if (stops.length === 0) {
            throw new NotFoundException(`No stops found for stopIds: ${stopIds.join(', ')}`)
        }

        let shape: LatLonPoint[] = []
        for (const feature of matching) {
            if (feature.geometry.type === 'LineString') {
                shape = (feature.geometry as LineString).coordinates.map(
                    ([lon, lat]): LatLonPoint => ({ lat, lon })
                )
            }
        }

        const firstFeature = this.stopsFeatures.find(
            f => f.properties?.code === matching[0]?.properties?.FIRST_STOP
        ) as Feature<Point> | undefined

        const lastFeature = this.stopsFeatures.find(
            f => f.properties?.code === matching[0]?.properties?.LAST_STOP_
        ) as Feature<Point> | undefined

        if (!firstFeature) {
            throw new NotFoundException(`First stop not found for code: ${matching[0]?.properties?.FIRST_STOP}`)
        }
        if (!lastFeature) {
            throw new NotFoundException(`Last stop not found for code: ${matching[0]?.properties?.LAST_STOP_}`)
        }

        const firstStop: StopDto = {
            description: firstFeature.properties?.description ?? '',
            descriptionEl: firstFeature.properties?.['description[el]'] ?? '',
            descriptionEn: firstFeature.properties?.['description[en]'] ?? '',
            lat: firstFeature.geometry.coordinates[1],
            lon: firstFeature.geometry.coordinates[0],
        }

        const lastStop: StopDto = {
            description: lastFeature.properties?.description ?? '',
            descriptionEl: lastFeature.properties?.['description[el]'] ?? '',
            descriptionEn: lastFeature.properties?.['description[en]'] ?? '',
            lat: lastFeature.geometry.coordinates[1],
            lon: lastFeature.geometry.coordinates[0],
        }

        return new RouteResultDto(stops, firstStop, lastStop, shape)
    }
}
