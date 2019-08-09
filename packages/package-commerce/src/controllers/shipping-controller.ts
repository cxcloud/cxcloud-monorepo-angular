import { GET, Path } from 'typescript-rest';
import { Tags } from 'typescript-rest-swagger';
import { Shipping } from '@cxcloud/commerce';
import { ShippingMethod } from '@cxcloud/ct-types/shipping';
import { logger } from '../utils/logger';

@Path('/shipping')
export class ShippingController {
  @Path('/methods')
  @Tags('shipping')
  @GET
  getShippingMethods(): Promise<ShippingMethod[]> {
    try {
      return Shipping.fetchMethods();
    } catch (err) {
      logger.error(err);
      return err;
    }
  }
}
