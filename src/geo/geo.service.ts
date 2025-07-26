import { Injectable } from '@nestjs/common'
import { parseShapefileToGeoJson } from './utils/shp-to-geojson'
import * as fs from 'fs'
import { parse } from 'csv-parse/sync'

interface StopCsvRow {
    STOP_ID: string
    NAME: string
    LAT: string
    LON: string
    [key: string]: string
}

@Injectable()
export class GeoService {

    async loadGeoDataFromZip(zipPath: string) {
        if (!fs.existsSync(zipPath)) {
            throw new Error(`File not found at path: ${zipPath}`)
        }

        const zipBuffer = fs.readFileSync(zipPath)
        const geojson = await parseShapefileToGeoJson(zipBuffer)
        return geojson
    }

    async loadGeoDataFromCsv(csvPath: string) {
        if (!fs.existsSync(csvPath)) {
            throw new Error(`File not found at path: ${csvPath}`)
        }

        const content = fs.readFileSync(csvPath, 'utf-8')
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            delimiter: '',
        }) as StopCsvRow[]

        const features = records.flatMap((row) => {
            const lat = Number.parseFloat(row['lat'].replace(',', '.'))
            const lon = Number.parseFloat(row['lon'].replace(',', '.'))

            if (Number.isNaN(lat) || Number.isNaN(lon)) {
                return []
            }

            return [{
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [lon, lat],
                },
                properties: row,
            }]
        })

        return {
            type: 'FeatureCollection',
            features,
        }
    }
}