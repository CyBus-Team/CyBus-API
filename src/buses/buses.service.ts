import { join } from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as protobuf from 'protobufjs';

@Injectable()
export class BusesService {
    private readonly feedUrl = 'http://20.19.98.194:8328/Api/api/gtfs-realtime';
    private readonly protoPath = join(process.cwd(), 'data', 'buses/gtfs-realtime.proto');

    private cache: any[] = [];
    private lastUpdated: Date | null = null;
    private root: protobuf.Root | null = null;

    async loadProto(): Promise<protobuf.Root> {
        if (!this.root) {
            this.root = await protobuf.load(this.protoPath);
        }
        return this.root;
    }

    async fetchVehiclePositions(): Promise<any[]> {
        const root = await this.loadProto();
        const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

        const response = await axios.get(this.feedUrl, { responseType: 'arraybuffer' });
        const buffer = new Uint8Array(response.data as ArrayBuffer);
        const message = FeedMessage.decode(buffer);
        const object = FeedMessage.toObject(message, { enums: String });

        return object.entity
            .filter((e: any) => e.vehicle)
            .map((e: any) => ({
                id: e.id,
                vehicleId: e.vehicle.vehicle?.id,
                label: e.vehicle.vehicle?.label,
                latitude: e.vehicle.position?.latitude,
                longitude: e.vehicle.position?.longitude,
                timestamp: e.vehicle.timestamp,
                routeId: e.vehicle.trip?.routeId,
            }));
    }

    @Cron(process.env.BUSES_PARSE_CRON ?? CronExpression.EVERY_MINUTE)
    async updateCache() {
        try {
            const vehicles = await this.fetchVehiclePositions();
            this.cache = vehicles;
            this.lastUpdated = new Date();
        } catch (error) {
            throw error
        }
    }

    getCachedVehicles(): any[] {
        return this.cache;
    }

    getLastUpdated(): Date | null {
        return this.lastUpdated;
    }
}