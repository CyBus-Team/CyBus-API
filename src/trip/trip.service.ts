import { Injectable } from '@nestjs/common'
import { GetTripDto, TripStep } from './dto';

@Injectable()
export class TripService {
    async planTrip(dto: GetTripDto): Promise<TripStep[]> {
        return [
            {
                type: 'walk',
                from: [dto.fromLat, dto.fromLng],
                to: [59.95, 30.3],
                path: [
                    [dto.fromLat, dto.fromLng],
                    [59.95, 30.3],
                ],
            },
            {
                type: 'ride',
                fromStopId: 'stop123',
                toStopId: 'stop789',
                lineName: '3A',
                tripId: 'trip-abc',
                stopsCount: 6,
            },
            {
                type: 'walk',
                from: [59.96, 30.31],
                to: [dto.toLat, dto.toLng],
                path: [
                    [59.96, 30.31],
                    [dto.toLat, dto.toLng],
                ],
            },
        ];
    }
}
