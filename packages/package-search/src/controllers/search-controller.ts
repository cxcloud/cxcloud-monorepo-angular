import {
  ContextRequest,
  GET,
  Path,
  PathParam,
  QueryParam
} from 'typescript-rest';
import { Tags } from 'typescript-rest-swagger';
import { searchIndex } from '@cxcloud/search';
import { Request } from 'express';

@Path('/search')
export class SearchController {
  @Path('/byIndex/:indexName')
  @Tags('search')
  @GET
  getEntryById(
    @ContextRequest req: Request,
    @PathParam('indexName') indexName: string,
    @QueryParam('query') query: string,
    @QueryParam('filters') filters?: string,
    @QueryParam('facets') facets?: string,
    @QueryParam('hitsPerPage') hitsPerPage?: number,
    @QueryParam('attributesToRetrieve') attributesToRetrieve?: string[]
  ) {
    return searchIndex(indexName, req.query);
  }
}
