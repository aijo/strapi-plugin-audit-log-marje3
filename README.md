# Audit Log Plugin

## Description

This plugin aims to store all user interactions as logs that can be accessed easily and securely through the use of permissions. Each log entry contains the following:

```javascript
{
    "User": "", // Authenticated users email or 'Anonymous' if not found.
    "URL": "", // Endpoint that the user sent a request to. ex: '/admin/login'
    "IP-Address": "", // IP address of the user.
    "HTTP-Method": "", // HTTP method of the request that the user sent
    "HTTP-Status": "", // HTTP status of the response strapi will send to the user. ex: 200 means that the operation was successful
    "Request-Body": {}, // Contains the body of the request send by the user
    "Response-Body": {} // Contains the body of the response that strapi will send to the user
}
```

## Implementation

### Folder Structure

- `admin`: This folder holds the frontend code.
- `server`: This folder contains the backend code.

### Backend

#### Content-Type Creation

A new content-type named `logs` is created using the `strapi generate` command, with the following components:

- Route: defines a route to fetch logs according to permissions
- Controller: handles queryies and redirects
- Core Service: returns a paginated result

#### Middleware: intercept-request.js

The `intercept-request.js` middleware is crafted to enhance request handling. It operates in the following manner:

1. Intercepts incoming requests.
2. Processes these requests.
3. Creates an entry in the `logs` utilizing data extracted from both the request and the resulting response.

This middleware is automatically registered globally in `register.js`.

#### Permissions Management

To ensure secure functioning, the necessary permissions for the plugin are generated and applied in the `bootstrap.js` file. These permissions are subsequently associated with specific routes through the use of the `admin::hasPermission` policy.

#### Custom Router and Controller

A custom router and controller `log-settings` is created to allow users to read and update plugin settings from the frontend using HTTP requests. They also handle validation for user submitted plugin settings using `yup`.

#### Cron task and custom Service

A cron task and service `delete-log` are created to handle deletion of records according to plugin settings. The plugin settings are as follows:

```javascript
{
    enabled: false, // True / False
    frequency: "", // "logAge" / "logCount"
    logAge: {
        value: 0, // Number of day(s)/week(s)...
        interval: "" // day / week / month / year
    },
    logCount: {
        value: 0, // Number of logs to keep
    }
}
```

The cron task executes once daily. It calls the `deleteJob()` function from the service `delete-log`, which checks the plugin settings and deletes the logs accordingly. Currently, the settings can only be changed within the frontend.

The settings are stored using `strapi.store`, with the default settings set in the `bootstrap.js` file.

### Frontend

TODO

## Issues

1. When users open the logs tab for the first time, the strapi backend will send them to a web address with predefined settings. This leads to two requests being made. This happens because the technology used to send these requests, called axios, has a feature that manages redirects automatically, even when I try to disable it. So, the only option available is to compare the request's address with the address in the response. If they match, the web address in the browser's bar is updated, causing yet another data retrieval process.
