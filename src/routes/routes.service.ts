import { Injectable } from '@nestjs/common';
import { RouteResultDto, RoutesQueryDto } from './dto';
import { join } from 'path';
import { readFileSync } from 'fs';
import { Feature, LineString, Point } from 'geojson';

@Injectable()
export class RoutesService {
    private readonly features: Feature[] = []

    constructor() {
        try {
            const filePath = join(process.cwd(), 'data', 'geojson', 'routes.geojson')
            const raw = readFileSync(filePath, 'utf-8')
            const json = JSON.parse(raw)
            this.features = json.features || []
        } catch (error) {
            throw error
        }
    }

    getRouteByTrip(dto: RoutesQueryDto): RouteResultDto {
        const matching = this.features.filter(f =>
            f.properties?.TRIP_ID === dto.tripId &&
            f.properties?.LINE_NAME === dto.lineName
        )

        const stops: Point[] = []
        let shape: LineString | null = null

        for (const feature of matching) {
            if (feature.geometry.type === 'Point') {
                stops.push(feature.geometry as Point)
            } else if (feature.geometry.type === 'LineString') {
                shape = feature.geometry as LineString
            }
        }

        return new RouteResultDto(stops, shape)
    }
}
