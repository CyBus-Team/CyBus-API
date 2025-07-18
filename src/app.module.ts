import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { UserModule } from './user/user.module'
import { BookmarkModule } from './bookmark/bookmark.module'
import { PrismaModule } from './prisma/prisma.module'
import { FeedbackModule } from './feedback/feedback.module'
import { AutocompleteModule } from './autocomplete/autocomplete.module';
import { GeoModule } from './geo/geo.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true // Makes the configuration available globally
    }),
    AuthModule,
    UserModule,
    BookmarkModule,
    PrismaModule,
    FeedbackModule,
    AutocompleteModule,
    GeoModule
  ],
})
export class AppModule { }
