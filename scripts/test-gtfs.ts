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
    const gtfsOutputDir = path.resolve(__dirname, '../data/gtfs/merged')
    const stopsCsvPath = path.resolve(__dirname, '../data/stops/stops.csv')
    const shapeZipPath = path.resolve(__dirname, '../data/shp/routes.zip')

    try {
        // GTFS data (assumes all ZIPs must be present)
        const allGtfsExist = zipPaths.every(p => fs.existsSync(p))
        if (allGtfsExist) {
            await geoService.loadGtfsData(zipPaths, gtfsOutputDir)
            console.log('✅ GTFS data processed successfully')
        } else {
            await geoTask.downloadAndMergeGtfs()
        }

        // Stops CSV to GeoJSON
        if (fs.existsSync(stopsCsvPath)) {
            const stopsGeoJson = await geoService.loadGeoDataFromCsv(stopsCsvPath)
            console.log('✅ Stops CSV parsed to GeoJSON:', JSON.stringify(stopsGeoJson, null, 2))
        } else {
            await geoTask.downloadAndConvertStopsCsv()
            const stopsGeoJson = await geoService.loadGeoDataFromCsv(stopsCsvPath)
            console.log('✅ Stops CSV parsed to GeoJSON after download:', JSON.stringify(stopsGeoJson, null, 2))
        }

        // Shapefile ZIP to GeoJSON
        if (fs.existsSync(shapeZipPath)) {
            const shapeGeoJson = await geoService.loadGeoDataFromZip(shapeZipPath)
            console.log('✅ Shapefile ZIP parsed to GeoJSON:', JSON.stringify(shapeGeoJson, null, 2))
        } else {
            await geoTask.handleGeoParsing()
            const shapeGeoJson = await geoService.loadGeoDataFromZip(shapeZipPath)
            console.log('✅ Shapefile ZIP parsed to GeoJSON after download:', JSON.stringify(shapeGeoJson, null, 2))
        }

    } catch (error) {
        console.error('❌ Error processing geo data:', error)
    }
}

main()