import {
  POST,
  GET,
  Path,
  PathParam,
  QueryParam,
  Context,
  ServiceContext
} from 'typescript-rest';
import { Tags, Security } from 'typescript-rest-swagger';
import { Orders } from '@cxcloud/commerce';
import { Order, PaginatedOrderResult } from '@cxcloud/ct-types/orders';
import { generateRandomNumber } from '../utils/random';
import { getQueryOptions } from '../utils/query';

interface ICreateOrder {
  cartId: string;
  cartVersion: number;
}

@Path('/orders')
export class OrdersController {
  @Tags('orders')
  @Security('token')
  @POST
  async createOrder(
    body: ICreateOrder,
    @Context ctx: ServiceContext
  ): Promise<Order> {
    const { cartId, cartVersion } = body;
    return Orders.create(
      cartId,
      cartVersion,
      await generateRandomNumber('CXO-'),
      ctx.response.locals.authToken
    );
  }

  @Tags('orders')
  @Security('token')
  @GET
  getOrders(
    @Context ctx: ServiceContext,
    @QueryParam('page') page?: number,
    @QueryParam('perPage') perPage?: number,
    @QueryParam('sortPath') sortPath?: string,
    @QueryParam('ascending') ascending?: boolean
  ): Promise<PaginatedOrderResult> {
    return Orders.fetchAll(
      ctx.response.locals.authToken,
      false,
      getQueryOptions(page, perPage, sortPath, ascending)
    );
  }

  @Path('/:id')
  @Tags('orders')
  @Security('token')
  @GET
  getOrderById(
    @PathParam('id') orderId: string,
    @Context ctx: ServiceContext
  ): Promise<Order> {
    return Orders.findById(orderId, ctx.response.locals.authToken);
  }
}
