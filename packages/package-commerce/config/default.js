require('dotenv').config({
  path: require('find-config')('.env')
});

module.exports = {
  port: 4003,
  debug: {
    logLevel: 'debug'
  },
  store: {
    defaultCurrency: 'EUR',
    supportedCurrencies: ['EUR', 'USD', 'GBP']
  },
  commerceTools: {
    authHost: `${process.env.CTP_AUTH_URL}`,
    apiHost: `${process.env.CTP_API_URL}`,
    projectKey: process.env.CTP_PROJECT_KEY,
    admin: {
      clientId: process.env.CTP_CLIENT_ID,
      clientSecret: process.env.CTP_CLIENT_SECRET
    },
    user: {
      clientId: process.env.CTP_USER_CLIENT_ID,
      clientSecret: process.env.CTP_USER_CLIENT_SECRET
    }
  },
  swaggerJsonDir: '../'
};
