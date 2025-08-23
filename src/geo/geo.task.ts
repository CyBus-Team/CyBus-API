import { Stream } from 'stream'
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { GeoService } from './geo.service'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as os from 'os'
import { createWriteStream, createReadStream } from 'fs'
import axios from 'axios'
import * as unzipper from 'unzipper'
import * as archiver from 'archiver'

@Injectable()
export class GeoTask {
    constructor(private readonly geoService: GeoService) { }

    // Cron job to fetch and convert SHP archive to GeoJSON (default: monthly at 12 PM Cyprus time)
    @Cron(process.env.ROUTES_PARSE_CRON ?? '0 9 1 * *')
    async handleGeoParsing() {
        const zipUrl = 'https://motionbuscard.org.cy/opendata/downloadfile'
        const zipPath = path.resolve(__dirname, '../../data/shp/routes.zip')
        const geoJsonOutputPath = path.resolve(__dirname, '../../data/geojson/routes.geojson')

        console.log('🌍 [GeoTask] ▶️ Starting handleGeoParsing...')

        try {
            // Step 1: Download the ZIP file from remote source
            const response = await axios.get<Stream>(zipUrl, {
                responseType: 'stream',
                params: {
                    file: 'Topology\\routes\\routes.zip',
                    rel: 'True',
                },
            })
            // Ensure the ZIP output directory exists
            await fs.mkdir(path.dirname(zipPath), { recursive: true })
            const writer = createWriteStream(zipPath)

            response.data.pipe(writer)

            await new Promise<void>((resolve, reject) => {
                writer.on('finish', () => resolve(undefined))
                writer.on('error', reject)
            })

            // Step 2: Convert SHP archive to GeoJSON
            // Replaced potential unzipper usage inside geoService with AdmZip-based extraction here if needed
            // Assuming geoService.loadGeoDataFromZip uses AdmZip internally now, otherwise this should be updated there.
            const geojson = await this.geoService.loadGeoDataFromZip(zipPath)

            // Step 3: Ensure the output directory exists
            await fs.mkdir(path.dirname(geoJsonOutputPath), { recursive: true })

            // Step 4: Save the converted GeoJSON file
            await fs.writeFile(geoJsonOutputPath, JSON.stringify(geojson, null, 2), 'utf-8')

            const featureCount = Array.isArray((geojson as any)?.features) ? (geojson as any).features.length : 0
            console.log(`✅ [GeoTask] Saved archive at: ${zipPath}`)
            console.log(`✅ [GeoTask] Saved GeoJSON (${featureCount} features) to: ${geoJsonOutputPath}`)
            console.log('🌍 [GeoTask] ✅ Finished handleGeoParsing')
        } catch (error) {
            console.error('🌍 [GeoTask] Failed to process geo data:', (error as any)?.message || error)
            console.log('🌍 [GeoTask] ✅ Finished handleGeoParsing')
        }
    }

    // Cron job to fetch GTFS ZIP archives and process them (default: monthly at 12 PM Cyprus time)
    @Cron(process.env.GTFS_PARSE_CRON ?? '0 9 1 * *')
    async downloadAndMergeGtfs() {
        const urls = [
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\6_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\2_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\4_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\5_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\9_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\10_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\11_google_transit.zip&rel=True',
        ]

        const outputDir = path.resolve(__dirname, '../../data/gtfs')
        await fs.mkdir(outputDir, { recursive: true })

        try {
            const downloadedFiles: string[] = []

            for (const url of urls) {
                const fileName = `gtfs${urls.indexOf(url) + 1}.zip`
                const zipPath = path.join(outputDir, fileName)

                const zipResponse = await axios.get<Stream>(url, { responseType: 'stream' })
                const zipWriter = createWriteStream(zipPath)
                zipResponse.data.pipe(zipWriter)

                await new Promise<void>((resolve, reject) => {
                    zipWriter.on('finish', () => resolve(undefined))
                    zipWriter.on('error', reject)
                })

                downloadedFiles.push(zipPath)
            }

            await this.geoService.loadGtfsData(downloadedFiles, outputDir)
        } catch (gtfsError) {
            console.error('[GeoTask] Failed to process GTFS archives:', gtfsError.message)
        }
    }

    // Cron job to download Cyprus OSM PBF file (default: monthly at 12 PM Cyprus time)
    @Cron(process.env.OSM_PBF_PARSE_CRON ?? '0 9 1 * *')
    async downloadOsmPbf() {
        const osmUrl = 'https://download.geofabrik.de/europe/cyprus-latest.osm.pbf'
        const osmPath = path.resolve(__dirname, '../../data/otp/data.osm.pbf')

        try {
            const response = await axios.get<Stream>(osmUrl, { responseType: 'stream' })
            await fs.mkdir(path.dirname(osmPath), { recursive: true })
            const writer = createWriteStream(osmPath)

            response.data.pipe(writer)

            await new Promise<void>((resolve, reject) => {
                writer.on('finish', () => resolve(undefined))
                writer.on('error', reject)
            })

            console.log(`[GeoTask] Downloaded OSM PBF file and saved to ${osmPath}`)
        } catch (error) {
            console.error('[GeoTask] Failed to download OSM PBF file:', error.message)
        }
    }

    // Cron job to merge GTFS archives for OTP (default: monthly at 12 PM Cyprus time)
    @Cron(process.env.OTP_GTFS_MERGE_CRON ?? '0 9 1 * *')
    async mergeGtfsArchivesForOtp() {
        const urls = [
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\6_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\2_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\4_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\5_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\9_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\10_google_transit.zip&rel=True',
            'https://www.motionbuscard.org.cy/opendata/downloadfile?file=GTFS\\11_google_transit.zip&rel=True',
        ]

        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gtfs-merge-'))
        const extractDirs: string[] = []

        try {
            // Download and extract each archive
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i]
                const zipPath = path.join(tempDir, `gtfs${i + 1}.zip`)
                console.log(`📥 [GeoTask] → Downloading GTFS: ${url} → ${zipPath}`)

                const response = await axios.get<Stream>(url, { responseType: 'stream' })
                await new Promise<void>((resolve, reject) => {
                    const writer = createWriteStream(zipPath)
                    response.data.pipe(writer)
                    writer.on('finish', () => resolve())
                    writer.on('error', reject)
                })

                // Extract to a separate directory using unzipper
                const extractDir = path.join(tempDir, `extracted${i + 1}`)
                await fs.mkdir(extractDir, { recursive: true })
                console.log(`📂 [GeoTask] → Extracting ZIP: ${zipPath} → ${extractDir}`)
                await createReadStream(zipPath).pipe(unzipper.Extract({ path: extractDir })).promise()
                extractDirs.push(extractDir)
            }

            // Collect all GTFS filenames from first extracted dir (assuming all have same files)
            const files = await fs.readdir(extractDirs[0])

            const mergedDir = path.join(tempDir, 'merged')
            await fs.mkdir(mergedDir)

            // For each file, merge contents from all extracted dirs
            for (const file of files) {
                console.log(`🧩 [GeoTask]   • Merging file: ${file}`)
                const mergedFilePath = path.join(mergedDir, file)
                let header: string | null = null
                let mergedLines: string[] = []

                for (const dir of extractDirs) {
                    const filePath = path.join(dir, file)
                    try {
                        const content = await fs.readFile(filePath, 'utf-8')
                        const normalized = content.replace(/^\uFEFF/, '') // remove BOM if present
                        const sanitized = normalized.split(/\r?\n/).filter(line => line.trim().length > 0)
                        const lines = sanitized
                        lines[0] = lines[0].replace(/^\uFEFF/, '') // Ensure BOM is removed from header too
                        if (lines.length === 0) continue

                        if (header === null) {
                            header = lines[0]
                            mergedLines.push(header)
                        }
                        // Append lines except header
                        if (file === 'fare_attributes.txt') {
                            if (!globalThis.__seenFareIds) {
                                globalThis.__seenFareIds = new Set<string>()
                            }
                            const seenFareIds = globalThis.__seenFareIds
                            for (const line of lines.slice(1)) {
                                const parts = line.split(',')
                                const fareId = parts[0]?.trim()

                                if (!fareId || seenFareIds.has(fareId)) {
                                    if (fareId) {
                                        console.warn(`[GeoTask] Skipping duplicate fare_id: ${fareId}`)
                                    }
                                    continue
                                }

                                seenFareIds.add(fareId)
                                mergedLines.push(line)
                            }
                        }
                        else if (file === 'stops.txt') {
                            if (!globalThis.__seenStopIds) {
                                globalThis.__seenStopIds = new Set<string>()
                            }
                            const seenStopIds = globalThis.__seenStopIds
                            for (const line of lines.slice(1)) {
                                const parts = line.split(',')
                                const stopId = parts[0]?.trim()

                                if (!stopId || seenStopIds.has(stopId)) {
                                    if (stopId) {
                                        console.warn(`[GeoTask] Skipping duplicate stop_id: ${stopId}`)
                                    }
                                    continue
                                }

                                seenStopIds.add(stopId)
                                mergedLines.push(line)
                            }
                        }
                        else if (file === 'trips.txt') {
                            if (!globalThis.__seenTripIds) {
                                globalThis.__seenTripIds = new Set<string>()
                            }
                            const seenTripIds = globalThis.__seenTripIds
                            for (const line of lines.slice(1)) {
                                const parts = line.split(',')
                                const tripId = parts[2]?.trim() // index 2 based on GTFS spec: route_id,service_id,trip_id,...

                                if (!tripId || seenTripIds.has(tripId)) {
                                    if (tripId) {
                                        console.warn(`[GeoTask] Skipping duplicate trip_id: ${tripId}`)
                                    }
                                    continue
                                }

                                seenTripIds.add(tripId)
                                mergedLines.push(line)
                            }
                        }
                        // Insert calendar_dates.txt handling after trips.txt and before agency.txt
                        else if (file === 'calendar_dates.txt') {
                            if (!globalThis.__seenCalendarDates) {
                                globalThis.__seenCalendarDates = new Set<string>()
                            }
                            const seenCalendarDates = globalThis.__seenCalendarDates
                            for (const line of lines.slice(1)) {
                                const key = line.trim()
                                if (!key || seenCalendarDates.has(key)) {
                                    if (key) {
                                        console.warn(`[GeoTask] Skipping duplicate calendar_date entry: ${key}`)
                                    }
                                    continue
                                }
                                seenCalendarDates.add(key)
                                mergedLines.push(line)
                            }
                        }
                        else if (file === 'agency.txt') {
                            if (!globalThis.__seenAgencyIds) {
                                globalThis.__seenAgencyIds = new Set<string>()
                            }
                            const seenAgencyIds = globalThis.__seenAgencyIds
                            for (const line of lines.slice(1)) {
                                const parts = line.split(',')
                                const agencyId = parts[0]?.trim()
                                if (!agencyId || seenAgencyIds.has(agencyId)) {
                                    if (agencyId) {
                                        console.warn(`[GeoTask] Skipping duplicate agency_id: ${agencyId}`)
                                    }
                                    continue
                                }
                                seenAgencyIds.add(agencyId)
                                mergedLines.push(line)
                            }
                        }
                        else {
                            mergedLines.push(...lines.slice(1).filter(line => line.trim() !== ''))
                        }
                    } catch {
                        // File might not exist in some archives, ignore
                    }
                }

                // Write merged content to mergedDir
                await fs.writeFile(mergedFilePath, mergedLines.join('\n'), 'utf-8')
            }

            // Create output directory if not exists
            const outputZipPath = path.resolve(__dirname, '../../data/otp/gtfs.zip')
            await fs.mkdir(path.dirname(outputZipPath), { recursive: true })

            // Create zip archive from mergedDir
            console.log(`🗜️ [GeoTask] → Writing merged ZIP to: ${outputZipPath}`)
            await new Promise<void>(async (resolve, reject) => {
                const output = createWriteStream(outputZipPath)
                const archive = archiver('zip', { zlib: { level: 9 } })

                output.on('close', () => resolve())
                archive.on('error', err => reject(err))

                archive.pipe(output)

                try {
                    const files = await fs.readdir(mergedDir)
                    for (const file of files) {
                        const fullPath = path.join(mergedDir, file)
                        archive.file(fullPath, { name: path.basename(file) }) // flat structure
                    }
                    await archive.finalize()
                } catch (err) {
                    reject(err)
                }
            })

            console.log(`✅ [GeoTask] GTFS archive successfully created at: ${outputZipPath}`)
        } catch (error) {
            console.error(`❌ [GeoTask] Failed to merge GTFS archives for OTP: ${error.message}`)
        } finally {
            // Cleanup temp directory
            try {
                await fs.rm(tempDir, { recursive: true, force: true })
            } catch {
                // ignore cleanup errors
            }
        }
    }

}
