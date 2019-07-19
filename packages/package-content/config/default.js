require('dotenv').config({
  path: require('find-config')('.env')
});

module.exports = {
  port: 4003,
  debug: {
    logLevel: 'debug'
  },
  contentful: {
    sdkConfig: {
      space: process.env.CONTENTFUL_SPACE_ID,
      accessToken: process.env.CONTENTFUL_DELIVERY_API_TOKEN
    }
  }
};
