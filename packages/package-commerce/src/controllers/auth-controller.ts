import { POST, Path, Context, ServiceContext } from 'typescript-rest';
import { Tags, Security } from 'typescript-rest-swagger';
import { Customers } from '@cxcloud/commerce';
import {
  TokenizedSignInResult,
  CustomerSignupDraft,
  AnonymousSignInResult
} from '@cxcloud/ct-types/customers';
import { generateRandomNumber } from '../utils/random';
import { logger } from '../utils/logger';

export interface ILogin {
  username: string;
  password: string;
}

@Path('/auth')
export class AuthController {
  @Context ctx!: ServiceContext;

  @Path('/login')
  @Tags('auth')
  @Security('token')
  @POST
  loginUser(body: ILogin): Promise<TokenizedSignInResult> {
    const { username, password } = body;
    try {
      logger.info(`User logged in successfully`, { username });
      return Customers.login(
        username,
        password,
        this.ctx.response.locals.authToken
      );
    } catch (err) {
      logger.error(`Login failed username ${username}`, err);
      return err;
    }
  }

  @Path('/register')
  @Tags('auth')
  @Security('token')
  @POST
  async registerUser(
    body: CustomerSignupDraft
  ): Promise<TokenizedSignInResult> {
    body = {
      customerNumber: (await generateRandomNumber('CXC-')) || undefined,
      ...body
    };
    try {
      logger.info(`User ${body.customerNumber} registered successfully`, body);
      return Customers.register(body, this.ctx.response.locals.authToken);
    } catch (err) {
      logger.error('Authorisation failed', err);
      return err;
    }
  }

  @Path('/login/anonymous')
  @Tags('auth')
  @POST
  loginAnonymous(): Promise<AnonymousSignInResult> {
    return Customers.loginAnonymously();
  }
}
