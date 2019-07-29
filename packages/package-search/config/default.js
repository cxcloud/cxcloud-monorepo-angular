require('dotenv').config({
  path: require('find-config')('.env')
});

module.exports = {
  port: 4003,
  debug: {
    logLevel: 'debug'
  },
  domain: 'demo.cxcloud.com',
  algolia: {
    applicationId: process.env.ALGOLIA_APPLICATION_ID,
    apiKey: process.env.ALGOLIA_API_KEY
  }
};
