import { Category } from '@cxcloud/ct-types/categories';
import { Order } from '@cxcloud/ct-types/orders';
import { client } from './client';
import { Cart } from '@cxcloud/ct-types/carts';
import config from 'config';

const { createRequestBuilder } = require('@commercetools/api-request-builder');
const projectKey = config.has('commerceTools.projectKey')
  ? config.get<string>('commerceTools.projectKey')
  : null;

const requestBuilder = createRequestBuilder({
  projectKey
});

export const getOrder = async (orderId: string): Promise<Order> => {
  const request = {
    uri: requestBuilder.orders.byId(orderId).build(),
    method: 'GET'
  };
  const resp = await client.execute(request);
  return resp.body;
};
