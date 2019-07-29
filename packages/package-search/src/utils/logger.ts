import config from 'config';
import winston, { format } from 'winston';
import pkgInfo from '../../package.json';
const { combine, json, errors } = format;
const level = config.get<string>('debug.logLevel') || 'info';

export const logger = winston.createLogger({
  level,
  format: combine(errors({ stack: true }), json()),
  defaultMeta: { service: pkgInfo.name },
  transports: [new winston.transports.Console()]
});
