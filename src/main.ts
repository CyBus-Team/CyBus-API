import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as bodyParser from 'body-parser'
import { GeoTask } from './geo/geo.task'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Support x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: true }))

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }))

  const geoTask = app.get(GeoTask)
  await geoTask.handleGeoParsing()

  await app.listen(process.env.PORT ?? 3333)
}
bootstrap()
