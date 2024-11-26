const winston = require('winston');
const pluginId = require("./pluginId");
require('winston-syslog').Syslog;

module.exports = async ({ strapi }) => {
  // Get Logger Setting
  let host = await strapi.config.get(`plugin.${pluginId}`).logger.host || 'localhost';
  let port = await strapi.config.get(`plugin.${pluginId}`).logger.port || 514;
  let appName = await strapi.config.get(`plugin.${pluginId}`).logger.appName || 'strapi-audit-log';

  winston.createLogger({
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
};
