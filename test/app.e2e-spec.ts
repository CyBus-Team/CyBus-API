import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { PrismaService } from 'src/prisma/prisma.service';
import pactum from 'pactum';
import { like } from 'pactum-matchers';
import { FeedbackDto } from 'src/feedback/dto';
import { AutocompleteProvider } from 'src/autocomplete/providers/autocomplete-provider.interface';

describe('App E2E Tests', () => {
  let app: INestApplication
  let prisma: PrismaService
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      })
    )
    await app.init()
    await app.listen(3334)

    prisma = app.get(PrismaService)
    await prisma.cleanDb()
    pactum.request.setBaseUrl('http://localhost:3334')
  })

  afterAll(() => {
    app.close()
  })

  describe('Feedbacks', () => {
    const dto: FeedbackDto = {
      message: 'Test Feedback',
      rating: 5,
      email: 'test@test.com',
    }
    describe('Create Feedback', () => {
      it('should fail if message is empty', () => {
        return pactum.spec().post('/feedback').withBody({ rating: dto.rating, email: dto.email }).expectStatus(400)
      })
      it('should fail if rating is empty', () => {
        return pactum.spec().post('/feedback').withBody({ message: dto.message, email: dto.email }).expectStatus(400)
      })
      it('should fail if rating is not a number', () => {
        return pactum.spec().post('/feedback').withBody({ message: dto.message, rating: 'five', email: dto.email }).expectStatus(400)
      })
      it('should fail if rating is less than 1', () => {
        return pactum.spec().post('/feedback').withBody({ message: dto.message, rating: 0, email: dto.email }).expectStatus(400)
      })
      it('should fail if rating is greater than 5', () => {
        return pactum.spec().post('/feedback').withBody({ message: dto.message, rating: 6, email: dto.email }).expectStatus(400)
      })
      it('should fail if no body is provided', () => {
        return pactum.spec().post('/feedback').expectStatus(400)
      })
      it('should save feedback', () => {
        return pactum.spec().post('/feedback').withBody(dto).expectStatus(201)
      })
    })
  })

  describe('Autocomplete (mocked)', () => {
    let app: INestApplication;

    const mockAutocompleteProvider: AutocompleteProvider = {
      search: jest.fn().mockImplementation((dto) => {
        if (!dto.q) return Promise.resolve([]);
        return Promise.resolve([
          {
            name: 'Place C',
            address: 'Far City',
            lat: 12.0,
            lon: 58.0,
            source: 'mock',
          },
          {
            name: 'Place A',
            address: 'Near City',
            lat: 34.7001,
            lon: 33.0001,
            source: 'mock',
          },
          {
            name: 'Place B',
            address: 'Middle City',
            lat: 20.0,
            lon: 40.0,
            source: 'mock',
          },
        ]);
      }),
    };

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider('AUTOCOMPLETE_PROVIDERS')
        .useValue([mockAutocompleteProvider])
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
      await app.init();
      await app.listen(0);
      pactum.request.setBaseUrl(await app.getUrl());
    });

    afterAll(async () => {
      await app.close();
    });

    it('should return mock result for valid query', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .expectStatus(200)
        .expectJsonLike([
          {
            name: 'Place C',
            source: 'mock',
          },
          {
            name: 'Place A',
            source: 'mock',
          },
          {
            name: 'Place B',
            source: 'mock',
          },
        ]);
    });

    it('should fail if query is missing', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .expectStatus(400);
    });

    it('should fail if limit is 0', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('limit', 0)
        .expectStatus(400);
    });

    it('should fail if limit is negative', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('limit', -3)
        .expectStatus(400);
    });

    it('should fail if limit is not a number', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('limit', 'five')
        .expectStatus(400);
    });

    it('should fail if language is invalid', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('language', 'de')
        .expectStatus(400);
    });

    it('should accept supported language: en', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('language', 'en')
        .expectStatus(200);
    });

    it('should accept supported language: el', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('language', 'el')
        .expectStatus(200);
    });

    it('should accept supported language: ru', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('language', 'ru')
        .expectStatus(200);
    });

    it('should accept supported language: uk', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('language', 'uk')
        .expectStatus(200);
    });

    it('should fail if latitude is not a number', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('latitude', 'north')
        .expectStatus(400);
    });

    it('should fail if longitude is not a number', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('longitude', 'east')
        .expectStatus(400);
    });

    it('should accept valid latitude and longitude', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('latitude', 34.7)
        .withQueryParams('longitude', 33.0)
        .expectStatus(200);
    });

    it('should return only the limited number of results', () => {
      return pactum.spec()
        .get('/autocomplete/search')
        .withQueryParams('q', 'Lidl')
        .withQueryParams('limit', 2)
        .expectStatus(200)
        .expectJsonLength(2);
    });
  })
  describe('Buses', () => {
    it('should return list of vehicles', () => {
      return pactum.spec()
        .get('/buses')
        .expectStatus(200)
        .expectJsonLike([
          {
            vehicleId: like('any'),
            routeId: like('any'),
            label: like('any'),
            shortLabel: like('any'),
            latitude: like(1),
            longitude: like(1),
            timestamp: like(1),
          },
        ]);
    });

    it('should return meta with updatedAt and vehiclesCount', () => {
      return pactum.spec()
        .get('/buses/meta')
        .expectStatus(200)
        .expectJsonLike({
          updatedAt: like('any'),
          vehiclesCount: like(1),
        });
    });
  });
})
