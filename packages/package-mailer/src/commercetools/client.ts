import { SdkConfig } from '@cxcloud/ct-types/sdk';
import config from 'config';

const { createClient } = require('@commercetools/sdk-client');
const {
  createAuthMiddlewareForClientCredentialsFlow
} = require('@commercetools/sdk-middleware-auth');

const getConfig = () => {
  if (!config.has('commerceTools')) {
    throw new Error('Project has not been configured yet. Check docs first.');
  }
  return config.get<SdkConfig>('commerceTools');
};

const commerceToolsConfig = getConfig();

export const client = createClient({
  middlewares: [
    createAuthMiddlewareForClientCredentialsFlow({
      host: commerceToolsConfig.authHost,
      projectKey: commerceToolsConfig.projectKey,
      credentials: {
        clientId: commerceToolsConfig.admin.clientId,
        clientSecret: commerceToolsConfig.admin.clientSecret
      }
    })
  ]
});
