const _ = require("lodash");
const pluginId = require("../utils/pluginId");
const createLogger = require("../utils/logger");

const getFilterResult = (filter, actualValue, checkFunction) => {
  let result = true;
  let check = (val, valToCheck) => val === valToCheck;
  if (checkFunction) check = checkFunction;
  if (filter) {
    if (filter.include) {
      result = filter.include.some((val) => check(val, actualValue));
    } else if (filter.exclude) {
      result = !filter.exclude.some((val) => check(val, actualValue));
    }
  }
  return result;
};

const replaceContents = (obj, excludedValues) =>
  _.mapValues(obj, (value, key) => {
    if (excludedValues.includes(key)) return "#_REDACTED_#";
    if (typeof value === "object")
      return replaceContents(value, excludedValues);
    return value;
  });

const getEventType = (url) => {
  if (url.includes('login')) return 'LOGIN';
  if (url.includes('logout')) return 'LOGOUT';
  if (url.includes('publish')) return 'PUBLISH CONTENT';
  if (url.includes('content-manager')) return 'UPDATE CONTENT';
  if (url.includes('content-type-builder')) return 'UPDATE MODEL'
  if (url.includes('bulk-delete')) return 'DELETE FILE';
  if (url.includes('upload')) return 'UPLOAD FILE';
  return 'OTHER';
};

module.exports = ({ strapi }) => {
  strapi.server.use(async (ctx, next) => {
    await next();
    const auditLogger = await createLogger({ strapi });
    const config = strapi.config.get(`plugin::${pluginId}`);

    const endpoint = getFilterResult(
      config.filters.endpoint,
      ctx.url,
      (val, valToCheck) => valToCheck.startsWith(val),
    );
    const status = getFilterResult(config.filters.status, ctx.status);
    const method = getFilterResult(config.filters.method, ctx.method);

    if (endpoint && status && method) {
      let request = {};
      let response = {};

      if (ctx.request.body) {
        request = replaceContents(
          JSON.parse(JSON.stringify(ctx.request.body)),
          config.redactedValues,
        );
      }

      if (ctx.response.body) {
        response = replaceContents(
          JSON.parse(JSON.stringify(ctx.response.body)),
          config.redactedValues,
        );
      }

      const data = {
        user: ctx.state.user !== undefined ? ctx.state.user.email : "Anonymous",
        url: ctx.url,
        ip_address: ctx.ip,
        http_method: ctx.method,
        http_status: ctx.status,
        request_body: request,
        response_body: response,
      };

      strapi.entityService.create(`plugin::${pluginId}.log`, {
        data,
      });

      const date = new Date();
      const pad = (num) => num.toString().padStart(2, '0');
      const day = pad(date.getDate());
      const month = pad(date.getMonth() + 1);
      const year = date.getFullYear();
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());
      
      const timestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
      const logData = {
        timestamp,
        loggername: config.logger.appName,
        appid: config.logger.appId,
        appname: config.logger.appName,
        eventtype: getEventType(ctx.url),
        sourceaddress: ctx.ip,
        sourcehostname: '',
        sourceuser: data.user,
        sourceobject: '', //JSON.stringify(request),
        destinationaddress: strapi.config.get('server.host') || '',
        destinationhostname: '',
        destinationuser: data.user,
        destinationobject: '', //JSON.stringify(response),
        status: ctx.status >= 200 && ctx.status < 300 ? 'Success' : 'Failure',
        message: '',
        other: ''
      };

      const logMessage = Object.values(logData).join('|');
      auditLogger.info(logMessage);
    }
  });
};
