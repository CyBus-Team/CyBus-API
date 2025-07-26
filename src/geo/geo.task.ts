import { Stream } from 'stream'
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { GeoService } from './geo.service'
import * as path from 'path'
import * as fs from 'fs/promises'
import { createWriteStream } from 'fs'
import axios from 'axios'

@Injectable()
export class GeoTask {
    constructor(private readonly geoService: GeoService) { }

    // Cron job to fetch and convert SHP archive to GeoJSON (default: daily at 3 AM)
    @Cron(process.env.ROUTES_PARSE_CRON ?? '0 3 * * *')
    async handleGeoParsing() {
        const zipUrl = 'https://motionbuscard.org.cy/opendata/downloadfile'
        const zipPath = path.resolve(__dirname, '../../data/shp/routes.zip')
        const geoJsonOutputPath = path.resolve(__dirname, '../../data/geojson/routes.geojson')

        try {
            // Step 1: Download the ZIP file from remote source
            const response = await axios.get<Stream>(zipUrl, {
                responseType: 'stream',
                params: {
                    file: 'Topology\\routes\\routes.zip',
                    rel: 'True',
                },
            })
            const writer = createWriteStream(zipPath)

            response.data.pipe(writer)

            await new Promise<void>((resolve, reject) => {
                writer.on('finish', () => resolve(undefined))
                writer.on('error', reject)
            })

            // Step 2: Convert SHP archive to GeoJSON
            const geojson = await this.geoService.loadGeoDataFromZip(zipPath)

            // Step 3: Ensure the output directory exists
            await fs.mkdir(path.dirname(geoJsonOutputPath), { recursive: true })

            // Step 4: Save the converted GeoJSON file
            await fs.writeFile(geoJsonOutputPath, JSON.stringify(geojson, null, 2), 'utf-8')

            console.log(`[GeoTask] Parsed ${geojson} features and saved to ${geoJsonOutputPath}`)
        } catch (error) {
            console.error('[GeoTask] Failed to process geo data:', error.message)
        }
    }


    // Cron job to fetch and convert CSV stops file to GeoJSON (default: daily at 4 AM)
    @Cron(process.env.STOPS_PARSE_CRON ?? '0 4 * * *')
    async downloadAndConvertStopsCsv() {
        const csvUrl = 'https://motionbuscard.org.cy/opendata/downloadfile'
        const csvPath = path.resolve(__dirname, '../../data/stops/stops.csv')
        const stopsGeoJsonOutputPath = path.resolve(__dirname, '../../data/geojson/stops.geojson')

        try {
            const csvResponse = await axios.get<Stream>(csvUrl, {
                responseType: 'stream',
                params: {
                    file: 'Topology\\stops\\stops.csv',
                    rel: 'True',
                },
            })
            const csvWriter = createWriteStream(csvPath)

            csvResponse.data.pipe(csvWriter)

            await new Promise<void>((resolve, reject) => {
                csvWriter.on('finish', () => resolve(undefined))
                csvWriter.on('error', reject)
            })

            const stopsGeojson = await this.geoService.loadGeoDataFromCsv(csvPath)

            await fs.writeFile(stopsGeoJsonOutputPath, JSON.stringify(stopsGeojson, null, 2), 'utf-8')
            console.log(`[GeoTask] Parsed stops and saved to ${stopsGeoJsonOutputPath}`)
        } catch (csvError) {
            console.error('[GeoTask] Failed to process stops CSV:', csvError.message)
        }
    }
}