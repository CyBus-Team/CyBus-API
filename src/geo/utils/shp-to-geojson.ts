import * as unzipper from 'unzipper'
import * as shapefile from 'shapefile'
import * as path from 'path'
import * as fs from 'fs/promises'
import type { Feature, Geometry } from 'geojson'

export async function parseShapefileToGeoJson(zipBuffer: Buffer) {
    const tempDir = path.resolve(__dirname, '../../../data/shp')
    await fs.mkdir(tempDir, { recursive: true })

    // Extract the ZIP to a temp directory
    await unzipper.Open.buffer(zipBuffer).then((directory) =>
        directory.extract({ path: tempDir, concurrency: 5 }),
    )

    const shpPath = path.join(tempDir, 'routes.shp')
    const dbfPath = path.join(tempDir, 'routes.dbf')

    const features: Feature[] = []
    const source = await shapefile.open(shpPath, dbfPath)

    while (true) {
        const result = await source.read()
        if (result.done) break
        features.push({
            type: 'Feature',
            geometry: result.value.geometry as Geometry,
            properties: result.value.properties,
        } as Feature)
    }

    return {
        type: 'FeatureCollection',
        features,
    }
}