import { Injectable, NotFoundException } from '@nestjs/common';
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
            f.properties?.LINE_ID === dto.tripId
        )
        if (matching.length === 0) {
            throw new NotFoundException(`No route found for tripId: ${dto.tripId}`);
        }

        const stops: Point[] = []
        let shape: LineString | null = null

        for (const feature of matching) {
            if (feature.geometry.type === 'Point') {
                stops.push(feature.geometry as Point)
            } else if (feature.geometry.type === 'LineString') {
                shape = feature.geometry as LineString
            }
        }

        const firstStop = matching[0]?.properties?.FIRST_STOP || null;
        const lastStop = matching[0]?.properties?.LAST_STOP_ || null;
        return new RouteResultDto(stops, shape, firstStop, lastStop);
    }
}
