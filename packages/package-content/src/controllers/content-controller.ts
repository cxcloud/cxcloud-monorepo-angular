import { GET, Path, PathParam, Context, ServiceContext } from 'typescript-rest';
import { Tags, Security } from 'typescript-rest-swagger';
import { getEntries, getEntry, getSpace } from '@cxcloud/content';

@Path('/content')
export class ContentController {
  @Context ctx!: ServiceContext;

  @Path('/byId/:id')
  @Tags('content')
  @GET
  getEntryById(@PathParam('id') entryId: string) {
    return getEntry(entryId);
  }

  @Path('/spaceInfo')
  @Tags('content')
  @GET
  getSpaceInfo() {
    return getSpace();
  }

  @Tags('content')
  @GET
  getEntries() {
    return getEntries(this.ctx.request.query);
  }
}
