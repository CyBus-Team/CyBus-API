import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(
    Strategy,
    'jwt',
) {
    constructor(
        config: ConfigService,
        private prisma: PrismaService
    ) {
        // Use ConfigService to get the JWT secret from the configuration
        const jwtSecret = config.get<string>('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET is not defined in configuration');
        }
        // Call the parent constructor with the JWT options
        // ExtractJwt.fromAuthHeaderAsBearerToken() will extract the JWT from the Authorization header
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: jwtSecret,
        })
    }

    async validate(payload: { sub: number, email: string }) {
        // The payload contains the user ID (sub) and email
        // We will use the user ID to fetch the user from the database
        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub,
            }
        })

        // If the user is not found, return null
        // This will cause the request to be unauthorized
        if (!user) {
            return null;
        }

        // Remove the hash field from the user object before returning
        // This is important for security reasons, as we don't want to expose the password hash
        const { hash, ...userWithoutHash } = user;
        return userWithoutHash;
    }
}