
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        console.log('GetUser decorator called');
        console.log('Request user:', request.user);
        if (!request.user) {
            return null;
        }
        if (data) {
            return request.user[data];
        }
        return request.user;
    },
)
