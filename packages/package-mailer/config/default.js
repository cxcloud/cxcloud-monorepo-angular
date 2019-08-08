require('dotenv').config({
  path: require('find-config')('.env')
});

module.exports = {
  senderEmail: `${process.env.SENDER_EMAIL}`,
  commerceTools: {
    authHost: `${process.env.CTP_AUTH_URL}`,
    apiHost: `${process.env.CTP_API_URL}`,
    projectKey: process.env.CTP_PROJECT_KEY,
    admin: {
      clientId: process.env.CTP_CLIENT_ID,
      clientSecret: process.env.CTP_CLIENT_SECRET
    }
  }
};
