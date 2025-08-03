import { promises as fs } from 'fs'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import axios from 'axios'
import * as protobuf from 'protobufjs'
import { BusResultDto, BusesMetaResultDto } from './dto'
import {
    GTFS_FEED_URL,
    GTFS_PROTO_PATH,
    ROUTES_GEOJSON_PATH,
    DEFAULT_BUSES_CRON
} from './constants/buses.constants'

@Injectable()
export class BusesService implements OnModuleInit {
    private readonly feedUrl = GTFS_FEED_URL
    private readonly protoPath = GTFS_PROTO_PATH

    private cache: BusResultDto[] = []
    private lastUpdated: Date | null = null
    private root: protobuf.Root | null = null
    private routeLabelsById: Map<string, string> = new Map()

    async loadProto(): Promise<protobuf.Root> {
        if (!this.root) {
            this.root = await protobuf.load(this.protoPath)
        }
        return this.root
    }

    private async loadRouteLabelsFromGeoJson() {
        try {
            const filePath = ROUTES_GEOJSON_PATH
            const exists = await fs.access(filePath).then(() => true).catch(() => false)
            if (!exists) {
                return
            }

            const raw = await fs.readFile(filePath, 'utf-8')
            const json = JSON.parse(raw)

            for (const feature of json.features) {
                if (!feature.properties) {
                    continue
                }
                const props = feature.properties
                if (props?.LINE_ID && props?.LINE_NAME) {
                    this.routeLabelsById.set(props.LINE_ID.toString(), props.LINE_NAME.toString())
                }
            }
        } catch (error) {
            console.log('❌ Failed to load routes.geojson:', error)
        }
    }

    async onModuleInit() {
        try {
            await this.loadRouteLabelsFromGeoJson()
        } catch (error) {
            console.log('🚀 onModuleInit failed in BusesService', error)
        }
    }

    async fetchVehiclePositions(): Promise<BusResultDto[]> {
        const root = await this.loadProto()
        const FeedMessage = root.lookupType('transit_realtime.FeedMessage')

        const response = await axios.get(this.feedUrl, { responseType: 'arraybuffer' })
        const buffer = new Uint8Array(response.data as ArrayBuffer)
        const message = FeedMessage.decode(buffer)
        const object = FeedMessage.toObject(message, { enums: String })

        return object.entity
            .filter((e: any) => e.vehicle)
            .map((e: any) => new BusResultDto(
                e.vehicle.vehicle?.id,
                e.vehicle.trip?.routeId,
                e.vehicle.vehicle?.label,
                e.vehicle.position?.latitude,
                e.vehicle.position?.longitude,
                e.vehicle.timestamp,
                this.routeLabelsById.get(e.vehicle.trip?.routeId) ?? ''
            ))
    }

    @Cron(DEFAULT_BUSES_CRON)
    async updateCache() {
        try {
            const vehicles = await this.fetchVehiclePositions()
            this.cache = vehicles
            this.lastUpdated = new Date()
        } catch (error) {
            throw error
        }
    }

    getCachedBuses(): BusResultDto[] {
        return this.cache
    }

    getMeta(): BusesMetaResultDto {
        try {
            return new BusesMetaResultDto(this.lastUpdated?.toISOString() ?? '', this.cache.length ?? 0)
        } catch (error) {
            throw error
        }
    }
}