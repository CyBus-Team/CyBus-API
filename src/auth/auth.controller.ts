import { Body, Controller, Post, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";

@Controller()
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post("signin")
    signin() {
        return this.authService.signin()
    }

    @Post("signup")
    signup(@Body() dto: AuthDto) {
        return this.authService.signup()
    }
}