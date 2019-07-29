import * as express from 'express';
import * as cors from 'cors';
import * as config from 'config';
import * as path from 'path';
import * as os from 'os';
import * as bodyParser from 'body-parser';
import { Server } from 'typescript-rest';
import { logger } from './utils/logger';
import { attachAuthToken } from './utils/auth-middleware';
import controllers from './controllers';

const { errorHandler } = require('express-api-error-handler');
const pkg = require('../package.json');

const app = express();
const port = config.get<number>('port') || 3000;
let server: any;

app.use(cors());
app.use(bodyParser.json());
app.use(attachAuthToken);
app.disable('x-powered-by');

// Health Check
app.get('/api/search', (req, res) => {
  res.json({
    health: 'OK',
    uptime: process.uptime(),
    hostname: os.hostname(),
    version: pkg.version,
    NODE_ENV: process.env.NODE_ENV
  });
});

// Load Controllers
const v1 = express.Router();
Server.buildServices(v1, ...controllers);

Server.swagger(
  v1,
  path.resolve(__dirname, '../dist/swagger.json'),
  '/api-docs'
);

app.use('/api/search/v1', v1);

// Final Handler
app.use(
  errorHandler({
    log: ({ err, req, res, body }: any) => {
      logger.error(err, `${body.status} ${req.method} ${req.url}`);
    },
    hideProdErrors: true // hide 5xx errors if NODE_ENV is "production" (default: false)
  })
);

server = app.listen(port, () => {
  logger.info(`Server started on port: ${port}`);
});

process.on('SIGTERM', () => {
  logger.info('Stopping server');
  if (server) {
    server.stop();
  }
  setTimeout(() => {
    process.exit(0);
  }, 5000);
});
