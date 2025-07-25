import { join } from 'path';
import { promises as fs } from 'fs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import * as protobuf from 'protobufjs';
import { BusResultDto } from './dto';

@Injectable()
export class BusesService implements OnModuleInit {
    private readonly feedUrl = 'http://20.19.98.194:8328/Api/api/gtfs-realtime';
    private readonly protoPath = join(process.cwd(), 'data', 'buses/gtfs-realtime.proto');

    private cache: BusResultDto[] = [];
    private lastUpdated: Date | null = null;
    private root: protobuf.Root | null = null;
    private routeLabelsById: Map<string, string> = new Map();

    async loadProto(): Promise<protobuf.Root> {
        if (!this.root) {
            this.root = await protobuf.load(this.protoPath);
        }
        return this.root;
    }

    private async loadRouteLabelsFromGeoJson() {
        const filePath = join(process.cwd(), 'data', 'geojson', 'routes.geojson');
        const raw = await fs.readFile(filePath, 'utf-8');
        const json = JSON.parse(raw);

        for (const feature of json.features) {
            const props = feature.properties;
            if (props?.LINE_ID && props?.LINE_NAME) {
                this.routeLabelsById.set(props.LINE_ID.toString(), props.LINE_NAME.toString());
            }
        }
    }

    async onModuleInit() {
        await this.loadRouteLabelsFromGeoJson();
    }

    async fetchVehiclePositions(): Promise<BusResultDto[]> {
        const root = await this.loadProto();
        const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

        const response = await axios.get(this.feedUrl, { responseType: 'arraybuffer' });
        const buffer = new Uint8Array(response.data as ArrayBuffer);
        const message = FeedMessage.decode(buffer);
        const object = FeedMessage.toObject(message, { enums: String });

        return object.entity
            .filter((e: any) => e.vehicle)
            .map((e: any): BusResultDto => ({
                vehicleId: e.vehicle.vehicle?.id,
                routeId: e.vehicle.trip?.routeId,
                label: e.vehicle.vehicle?.label,
                shortLabel: this.routeLabelsById.get(e.vehicle.trip?.routeId) ?? '',
                latitude: e.vehicle.position?.latitude,
                longitude: e.vehicle.position?.longitude,
                timestamp: e.vehicle.timestamp,
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

    getCachedVehicles(): BusResultDto[] {
        return this.cache;
    }

    getLastUpdated(): Date | null {
        return this.lastUpdated;
    }
}