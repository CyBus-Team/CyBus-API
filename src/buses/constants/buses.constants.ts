// src/buses/buses.constants.ts

import { CronExpression } from '@nestjs/schedule'
import { join } from 'path'

// URL to fetch GTFS-Realtime binary data from the external service
export const GTFS_FEED_URL = 'http://20.19.98.194:8328/Api/api/gtfs-realtime'

// Path to the GTFS-Realtime .proto schema file
export const GTFS_PROTO_PATH = join(process.cwd(), 'data', 'buses/gtfs-realtime.proto')

// Path to the routes.geojson file containing LINE_ID to LINE_NAME mapping
export const ROUTES_GEOJSON_PATH = join(process.cwd(), 'data', 'geojson', 'routes.geojson')

// Default cron expression used to fetch vehicle positions every minute
export const DEFAULT_BUSES_CRON = process.env.BUSES_PARSE_CRON ?? CronExpression.EVERY_MINUTE