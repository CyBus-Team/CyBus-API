import { Injectable } from '@nestjs/common'
import { parseShapefileToGeoJson } from './utils/shp-to-geojson'
import * as fs from 'fs'
import { parse } from 'csv-parse/sync'
import * as path from 'path'
import * as unzipper from 'unzipper'

/**
 * Ensures every CSV data row has exactly the same number of fields as the header.
 * Returns a sanitized CSV string and a list of skipped 1-based line numbers (including header as line 1).
 * Uses only csv-parse (already installed) and manual string assembly (no extra deps).
 */
function sanitizeCsvByHeader(raw: string, delimiter = ','): { csv: string; skipped: number[] } {
    // Parse as arrays (no column names) to count fields precisely
    const rows = parse(raw, {
        columns: false,
        skip_empty_lines: true,
        bom: true,
        delimiter,
        relax_quotes: true,
        trim: false,
    }) as string[][]

    if (!rows.length) return { csv: raw, skipped: [] }

    const header = rows[0]
    const expected = header.length
    const kept: string[][] = [header]
    const skipped: number[] = []

    for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (Array.isArray(r) && r.length === expected) {
            kept.push(r)
        } else {
            // +1 because rows are 0-based here but CSV line numbers are 1-based
            skipped.push(i + 1)
        }
    }

    // Rebuild a valid CSV manually to preserve commas and quotes correctly.
    const csv = kept
        .map(row =>
            row
                .map(field => {
                    const val = field == null ? '' : String(field)
                    if (val.includes(delimiter) || val.includes('"') || /\s/.test(val)) {
                        return '"' + val.replace(/"/g, '""') + '"'
                    }
                    return val
                })
                .join(delimiter),
        )
        .join('\n')

    return { csv, skipped }
}

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
        console.log('📦 [GeoService] ▶️ loadGeoDataFromZip')
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
        console.log('📄 [GeoService] ▶️ loadGeoDataFromCsv')
        if (!fs.existsSync(csvPath)) {
            throw new Error(`File not found at path: ${csvPath}`)
        }

        const content = fs.readFileSync(csvPath, 'utf-8')
        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            delimiter: ';',
            bom: true,
            relax_column_count: true,
            trim: true,
            on_record: (rec: any) => {
                for (const k in rec) if (rec[k] === '') rec[k] = null
                return rec
            },
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
        console.log('🗂️ [GeoService] ▶️ loadGtfsData')
        if (!Array.isArray(zipPaths)) {
            throw new Error('Expected zipPaths to be an array of strings')
        }
        await fs.promises.mkdir(outputDir, { recursive: true })

        const allRecordsMap = new Map<string, any[]>()

        for (const zipPath of zipPaths) {
            if (!fs.existsSync(zipPath)) {
                console.error(`  ❌ [GeoService] File not found: ${zipPath}`)
                continue
            }
            const stat = await fs.promises.stat(zipPath)
            console.log(`  📏 [GeoService] Zip file size for ${zipPath}: ${stat.size} bytes`)
            if (stat.size === 0) {
                console.error(`  ⚠️ [GeoService] Skipping empty zip file: ${zipPath}`)
                continue
            }

            console.log(`  📂 [GeoService] Opening zip file: ${zipPath}`)
            let directory
            try {
                directory = await unzipper.Open.file(zipPath)
            } catch (err) {
                console.error(`  ❌ [GeoService] Failed to open zip: ${zipPath}`, err)
                continue
            }
            console.log(`    📑 [GeoService] Opened zip file: ${zipPath}, found ${directory.files.length} files`)
            for (const fileEntry of directory.files) {
                if (!fileEntry.path.endsWith('.txt')) continue

                console.log(`    📄 [GeoService] Reading file from zip: ${fileEntry.path}`)
                const content = await fileEntry.buffer()
                const raw = content.toString('utf-8')
                const baseName = path.basename(fileEntry.path, '.txt')

                // Some GTFS feeds (e.g., fare_attributes.txt) may contain malformed rows with fewer fields than the header.
                // For OTP / OneBusAway, this causes "expected and actual number of csv fields differ".
                // We sanitize only when needed to avoid changing valid files.
                let rawToParse = raw
                let skippedLines: number[] = []

                if (baseName === 'fare_attributes') {
                    const sanitized = sanitizeCsvByHeader(raw, ',')
                    rawToParse = sanitized.csv
                    skippedLines = sanitized.skipped
                    if (skippedLines.length) {
                        console.warn(
                            `    ⚠️ [GeoService] fare_attributes.txt: skipped ${skippedLines.length} malformed line(s): ${skippedLines.join(', ')}`,
                        )
                    }
                }

                let records: any[] = []
                try {
                    records = parse(rawToParse, {
                        columns: true,
                        skip_empty_lines: true,
                        bom: true,
                        delimiter: ',',
                        // Be strict for fare_attributes after sanitation; keep legacy relaxed behavior for others
                        relax_column_count: baseName !== 'fare_attributes',
                        relax_quotes: true,
                        skip_records_with_error: baseName !== 'fare_attributes',
                        trim: true,
                        on_record: (rec: any) => {
                            for (const k in rec) if (rec[k] === '') rec[k] = null
                            return rec
                        },
                    })
                } catch (err) {
                    console.error(`    ❌ [GeoService] Failed to parse CSV ${fileEntry.path}:`, err)
                    continue
                }

                if (!allRecordsMap.has(baseName)) {
                    allRecordsMap.set(baseName, [])
                }

                if (Array.isArray(records)) {
                    const existing = allRecordsMap.get(baseName)!
                    for (const record of records) {
                        if (typeof record === 'object' && record !== null) {
                            existing.push(record)
                        }
                    }
                }
            }
        }

        for (const [baseName, records] of allRecordsMap.entries()) {
            const filePath = path.join(outputDir, `${baseName}.json`)
            await fs.promises.writeFile(filePath, JSON.stringify(records, null, 2), 'utf-8')
        }

        console.log(`✅ [GeoService] Finished processing GTFS files into ${outputDir}`)
    }

}