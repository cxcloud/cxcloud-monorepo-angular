import { GET, Path, PathParam } from 'typescript-rest';
import { Tags } from 'typescript-rest-swagger';
import { Products } from '@cxcloud/commerce';

@Path('/products')
export class ProductsController {
  @Path('/byCategoryId/:categoryId')
  @Tags('commerce', 'products')
  @GET
  findByCategoryId(@PathParam('categoryId') categoryId: string) {
    return Products.findByCategoryId(categoryId);
  }

  @Path('/:id')
  @Tags('commerce', 'products')
  @GET
  findProductById(@PathParam('id') productId: string) {
    return Products.findById(productId);
  }
}
