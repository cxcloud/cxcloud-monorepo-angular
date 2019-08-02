// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
import 'zone.js/dist/zone-error';

export const environment = {
  production: false,
  siteName: 'CXCloud DEV',
  commerce: {
    apiUrl: '/api/commerce/v1',
    indexName: 'dev_COMMERCE'
  },
  content: {
    apiUrl: '/api/content/v1',
    indexName: 'dev_CONTENT'
  },
  auth: {
    apiUrl: '/api/commerce/v1/auth'
  },
  search: {
    apiUrl: '/api/search/v1'
  }
};
