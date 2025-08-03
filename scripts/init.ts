// scripts/test-gtfs.ts
import { GeoService } from '../src/geo/geo.service'
import { GeoTask } from '../src/geo/geo.task'
import * as path from 'path'
import * as fs from 'fs'

async function main() {
    // Initialize services
    const geoService = new GeoService()
    const geoTask = new GeoTask(geoService)

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

    try {
        // GTFS data (assumes all ZIPs must be present)
        const allGtfsExist = zipPaths.every(p => fs.existsSync(p))
        if (allGtfsExist) {
            await geoService.loadGtfsData(zipPaths, gtfsOutputDir)
            console.log('✅ GTFS done')
        } else {
            await geoTask.downloadAndMergeGtfs()
        }

        // Stops CSV to GeoJSON
        if (fs.existsSync(stopsCsvPath)) {
            await geoService.loadGeoDataFromCsv(stopsCsvPath)
            console.log('✅ Stops done')
        } else {
            await geoTask.downloadAndConvertStopsCsv()
            await geoService.loadGeoDataFromCsv(stopsCsvPath)
            console.log('✅ Stops done')
        }

        // Shapefile ZIP to GeoJSON
        if (fs.existsSync(shapeZipPath)) {
            await geoService.loadGeoDataFromZip(shapeZipPath)
            console.log('✅ Shapes done')
        } else {
            await geoTask.handleGeoParsing()
            await geoService.loadGeoDataFromZip(shapeZipPath)
            console.log('✅ Shapes done')
        }

    } catch (error) {
        console.error('❌ Error processing geo data:', error)
    }
}

main()