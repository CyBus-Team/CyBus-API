// scripts/test-gtfs.ts
import { GeoService } from '../src/geo/geo.service'
import { GeoTask } from '../src/geo/geo.task'
import * as path from 'path'
import * as fs from 'fs'

async function main() {
    // Initialize services
    const geoService = new GeoService()
    const geoTask = new GeoTask(geoService)

    try {
        console.log('🌍 [GeoTask] ▶️ Starting downloadOsmPbf...')
        await geoTask.downloadOsmPbf()
        console.log('🌍 [GeoTask] ✅ Finished downloadOsmPbf')

        console.log('🌍 [GeoTask] ▶️ Starting mergeGtfsArchivesForOtp...')
        await geoTask.mergeGtfsArchivesForOtp()
        console.log('🌍 [GeoTask] ✅ Finished mergeGtfsArchivesForOtp')

        // Paths to GTFS zip archives
        const zipPaths = [
            path.resolve(__dirname, '../data/gtfs/gtfs1.zip'),
            path.resolve(__dirname, '../data/gtfs/gtfs2.zip'),
            path.resolve(__dirname, '../data/gtfs/gtfs3.zip'),
            path.resolve(__dirname, '../data/gtfs/gtfs4.zip'),
            path.resolve(__dirname, '../data/gtfs/gtfs5.zip'),
            path.resolve(__dirname, '../data/gtfs/gtfs6.zip'),
            path.resolve(__dirname, '../data/gtfs/gtfs7.zip'),
        ]
        const gtfsOutputDir = path.resolve(__dirname, '../data/gtfs')
        const stopsCsvPath = path.resolve(__dirname, '../data/stops/stops.csv')
        const shapeZipPath = path.resolve(__dirname, '../data/shp/routes.zip')

        // GTFS data (assumes all ZIPs must be present)
        console.log('🌍 [GeoTask] ▶️ Starting downloadAndMergeGtfs...')
        await geoTask.downloadAndMergeGtfs()
        console.log('🌍 [GeoTask] ✅ Finished downloadAndMergeGtfs')

        console.log('📦 [GeoService] ▶️ Starting loadGtfsData...')
        await geoService.loadGtfsData(zipPaths, gtfsOutputDir)
        console.log('📦 [GeoService] ✅ Finished loadGtfsData')
        console.log('✅ GTFS done')

        // Stops CSV to GeoJSON
        if (fs.existsSync(stopsCsvPath)) {
            console.log('🗂️ [GeoService] ▶️ Starting loadGeoDataFromCsv...')
            await geoService.loadGeoDataFromCsv(stopsCsvPath)
            console.log('🗂️ [GeoService] ✅ Finished loadGeoDataFromCsv')
            console.log('✅ Stops done')
        } else {
            console.log('🌍 [GeoTask] ▶️ Starting downloadAndConvertStopsCsv...')
            await geoTask.downloadAndConvertStopsCsv()
            console.log('🌍 [GeoTask] ✅ Finished downloadAndConvertStopsCsv')

            console.log('🗂️ [GeoService] ▶️ Starting loadGeoDataFromCsv...')
            await geoService.loadGeoDataFromCsv(stopsCsvPath)
            console.log('🗂️ [GeoService] ✅ Finished loadGeoDataFromCsv')
            console.log('✅ Stops done')
        }

        // Shapefile ZIP to GeoJSON
        if (fs.existsSync(shapeZipPath)) {
            console.log('🗂️ [GeoService] ▶️ Starting loadGeoDataFromZip...')
            await geoService.loadGeoDataFromZip(shapeZipPath)
            console.log('🗂️ [GeoService] ✅ Finished loadGeoDataFromZip')
            console.log('✅ Shapes done')
        } else {
            console.log('🌍 [GeoTask] ▶️ Starting handleGeoParsing...')
            await geoTask.handleGeoParsing()
            console.log('🌍 [GeoTask] ✅ Finished handleGeoParsing')

            console.log('🗂️ [GeoService] ▶️ Starting loadGeoDataFromZip...')
            await geoService.loadGeoDataFromZip(shapeZipPath)
            console.log('🗂️ [GeoService] ✅ Finished loadGeoDataFromZip')
            console.log('✅ Shapes done')
        }

    } catch (error) {
        console.error('❌ Error processing geo data:', error)
    }
}

main()