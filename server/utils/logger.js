const winston = require('winston');
const pluginId = require("./pluginId");
require('winston-syslog').Syslog;

// Change to directly export the logger
module.exports = async ({ strapi }) => {
  // Get Logger Setting
  const host = await strapi.config.get(`plugin::${pluginId}`).logger?.host || 'localhost';
  const port = await strapi.config.get(`plugin::${pluginId}`).logger?.port || 514;
  const appName = await strapi.config.get(`plugin::${pluginId}`).logger?.appName || 'strapi-audit-log';

  // Create logger with all methods explicitly defined
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.simple(),
        level: 'debug'
      }),
  
      // Syslog transport
      new winston.transports.Syslog({
        host: host,
        port: port,
        protocol: 'udp4',
        app_name: appName,
        format: winston.format.json(),
        level: 'info'
      })
    ]
  });

  // Explicitly return the logger object
  return logger;
};