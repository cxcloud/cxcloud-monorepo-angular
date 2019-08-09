import { GET, Path, PathParam } from 'typescript-rest';
import { Tags } from 'typescript-rest-swagger';
import { Categories } from '@cxcloud/commerce';
import { logger } from '../utils/logger';

@Path('/categories')
export class CategoriesController {
  @Tags('commerce', 'products', 'categories')
  @GET
  getCategories() {
    try {
      return Categories.fetchAll();
    } catch (err) {
      logger.error('Fetching of CT categories failed', err);
    }
  }

  @Path('/:id')
  @Tags('commerce', 'categories')
  @GET
  findProductById(@PathParam('id') categoryId: string) {
    return Categories.findById(categoryId);
  }
}
