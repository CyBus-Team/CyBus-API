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
}