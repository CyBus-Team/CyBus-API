import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from 'src/app.module'
import { PrismaService } from 'src/prisma/prisma.service';
import * as pactum from 'pactum'
import { AuthDto } from 'src/auth/dto';
import { FeedbackDto } from 'src/feedback/dto';
import { EditUserDto } from 'src/user/dto';

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
    await app.listen(3333)

    prisma = app.get(PrismaService)
    await prisma.cleanDb()
    pactum.request.setBaseUrl('http://localhost:3333')
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

      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Test',
          email: 'test@test.com'
        }
        return pactum.spec().patch('/users').withHeaders({
          Authorization: 'Bearer $S{userAt}'
        }).withBody(dto).expectStatus(200)
      })
    })

    describe('Edit user', () => { })
  })

  describe('Bookmarks', () => {
    describe('Create Bookmark', () => { })

    describe('Get Bookmarks', () => { })

    describe('Get Bookmark by Id', () => { })

    describe('Edit Bookmark', () => { })

    describe('Delete Bookmark', () => { })
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

});