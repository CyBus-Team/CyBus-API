import { Injectable } from '@nestjs/common'
import { parseShapefileToGeoJson } from './utils/shp-to-geojson'
import * as fs from 'fs'
import { parse } from 'csv-parse/sync'
import * as path from 'path'
import * as unzipper from 'unzipper'

interface StopCsvRow {
    STOP_ID: string
    NAME: string
    LAT: string
    LON: string
    [key: string]: string
}

@Injectable()
export class GeoService {

    /**
     * Loads and parses shapefile ZIP archive into GeoJSON format.
     * Expects the ZIP to contain SHP/DBF files required for shapefile parsing.
     */
    async loadGeoDataFromZip(zipPath: string) {
        if (!fs.existsSync(zipPath)) {
            throw new Error(`File not found at path: ${zipPath}`)
        }

        const zipBuffer = fs.readFileSync(zipPath)
        const geojson = await parseShapefileToGeoJson(zipBuffer)
        return geojson
    }

    /**
     * Loads a CSV file of stop points and converts it to a GeoJSON FeatureCollection.
     * The CSV is expected to contain `lat` and `lon` fields, using commas as decimal separators.
     */
    async loadGeoDataFromCsv(csvPath: string) {
        if (!fs.existsSync(csvPath)) {
            throw new Error(`File not found at path: ${csvPath}`)
        }

        const content = fs.readFileSync(csvPath, 'utf-8')
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ';',
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

    /**
     * Loads GTFS ZIP archives and extracts `.txt` files into individual `.json` files.
     * Each `.txt` file is parsed as a CSV and written as a corresponding `.json` file
     * to the specified output directory.
     */
    async loadGtfsData(zipPaths: string[], outputDir: string) {
        await fs.promises.mkdir(outputDir, { recursive: true })

        for (const zipPath of zipPaths) {
            const directory = await unzipper.Open.file(zipPath)
            for (const fileEntry of directory.files) {
                console.log(`Processing file: ${fileEntry.path}`)
                if (!fileEntry.path.endsWith('.txt')) continue

                const content = await fileEntry.buffer()
                const records = parse(content.toString('utf-8').replace(/^\uFEFF/, ''), {
                    columns: true,
                    skip_empty_lines: true,
                })

                const baseName = path.basename(fileEntry.path, '.txt')
                const filePath = path.join(outputDir, `${baseName}.json`)
                await fs.promises.writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8')
            }
        }

        console.log(`[GeoService] Finished processing GTFS files into ${outputDir}`)
    }

}