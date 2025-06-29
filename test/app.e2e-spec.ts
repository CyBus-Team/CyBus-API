import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { PrismaService } from 'src/prisma/prisma.service';
import * as pactum from 'pactum'
import { AuthDto } from 'src/auth/dto';
import { FeedbackDto } from 'src/feedback/dto';
import { EditUserDto } from 'src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';
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

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'test@test.com',
      password: '123',
    }
    describe('Sign Up', () => {
      it('should fail if email is empty', () => {
        return pactum.spec().post('/auth/signup').withBody({ password: dto.password }).expectStatus(400)
      })
      it('should fail if password is empty', () => {
        return pactum.spec().post('/auth/signup').withBody({ email: dto.email }).expectStatus(400)
      })
      it('should faild if no body is provided', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400)
      })
      it('should sign up', () => {
        return pactum.spec().post('/auth/signup').withBody(dto).expectStatus(201)
      })
    })

    describe('Sign In', () => {
      it('should fail if email is empty', () => {
        return pactum.spec().post('/auth/signin').withBody({ password: dto.password }).expectStatus(400)
      })
      it('should fail if password is empty', () => {
        return pactum.spec().post('/auth/signin').withBody({ email: dto.email }).expectStatus(400)
      })
      it('should faild if no body is provided', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400)
      })
      it('should sign in', () => {
        return pactum.spec().post('/auth/signin').withBody(dto).expectStatus(200).stores('userAt', 'access_token')
      })
    })
  })

  describe('Users', () => {
    describe('Get Me', () => {
      it('should get current user', () => {
        return pactum.spec().get('/users/me').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200)
      })
    })

    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Test',
          email: 'test@test.com',
        }
        return pactum.spec().patch('/users').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).withBody(dto).expectStatus(200).expectBodyContains(dto.firstName).expectBodyContains(dto.email)
      })
    })
  })

  describe('Bookmarks', () => {
    describe('Get empty Bookmarks', () => {
      it('should get empty bookmarks', () => {
        return pactum.spec().get('/bookmarks').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectBody([])
      })
    })

    describe('Create Bookmark', () => {
      it('should create bookmark', () => {
        const dto: CreateBookmarkDto = {
          title: 'Test Bookmark',
          link: 'https://test.com',
        }
        return pactum.spec().post('/bookmarks').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).withBody(dto).expectStatus(201).stores('bookmarkId', 'id')
      })
    })

    describe('Get Bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum.spec().get('/bookmarks').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectJsonLength(1)
      })
    })

    describe('Get Bookmark by Id', () => {
      it('should get bookmark by id', () => {
        return pactum.spec().get('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectBodyContains('$S{bookmarkId}')
      })
    })

    describe('Edit Bookmark by id', () => {
      const dto: EditBookmarkDto = {
        description: 'Test Bookmark Description',
        title: 'Test Bookmark Edited',
      }
      it('should edit bookmark', () => {
        return pactum.spec().patch('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}').withBody(dto).withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectBodyContains(dto.title).expectBodyContains(dto.description)
      })
    })

    describe('Delete Bookmark', () => {
      it('should delete bookmark', () => {
        return pactum.spec().delete('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(204)
      })

      it('should get empty bookmarks', () => {
        return pactum.spec().get('/bookmarks').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).expectStatus(200).expectBody([])
      })
    })
  })
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
          name: 'Mock Lidl',
          address: 'Mock City, Cyprus',
          lat: 12.34,
          lon: 56.78,
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
          name: 'Mock Lidl',
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
});
