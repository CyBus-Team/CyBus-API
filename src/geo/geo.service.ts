import { Injectable } from '@nestjs/common'
import { parseShapefileToGeoJson } from './utils/shp-to-geojson'
import * as fs from 'fs'

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
}