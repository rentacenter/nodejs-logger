'use strict';

// Module dependencies
const util = require('util');
const stream = require('stream');
const logzio = require('logzio-nodejs');

// Expose module
module.exports = function logger (environment, application, originator) {
    // Make sure to only import this library once
    if (console.__logger__) return;

    // Defaults that can be overridden with environment variables
    const logzioToken = process.env.LOGZIO_TOKEN;
    const logzioDebug = process.env.LOGZIO_DEBUG === "true";

    // Create Logz.io logger (only if token is in environment)
    var logzioLogger = null;
    if (process.env.LOGZIO_TOKEN) {
        console.info('Creating logz.io logger');
        logzioLogger = logzio.createLogger({
            token: logzioToken,                 // Mandatory.  Your API logging token.  Look it up in the Device Config tab in Logz.io
            // type: 'nodejs',                  // Log type.  Defaults to 'nodejs'
            protocol: 'https',                  // 'http', 'https', or 'udp'.  Default: http
            // sendIntervalMs: 10*1000,         // Time in milliseconds to wait between retry attempts.  Default: 10*1000 (10 sec)
            // bufferSize: 100,                 // The max number of messages the logger will accumulate before sending them all as bulk.  Default: 100
            // numberOfRetries: 3,              // The max number of retry attempts.  Default: 3
            debug: logzioDebug,                 // Should the logger print debug messages to the console?  Default: false
            // supressErrors: false,            // Suppress logging unexpected logzio errors?  Default: false
            // callback:                        // A callback function called when an unrecoverable error has occured in the logger.  Default: log event
            // timeout: undefined,              // the read/write/connection timeout in milliseconds.  Default: undefined
            addTimestampWithNanoSecs: true,     // Add a timestamp with nano seconds granularity.  This is needed when many logs are sent in the same
                                                //   millisecond, so you can properly order the logs in Kibana.  The added timestamp field will be
                                                //   @timestamp_nano.  Default: false
            extraFields: {                      // Any extra fields to log by default with every event
                environment: environment,
                application: application,
                originator: originator
            }
        });
    } else {
        console.warn('No Logz.io token specified, not creating logger.');
    }

    // Create a custom Console for log message formatting
    const chunks = [];
    const ws = new stream.Writable({
        write: function(chunk, encoding, next) {
            chunks.push(chunk);
            next();
        }
    });
    const customConsole = new console.Console(ws, ws);

    // Override each of the standard log methods
    ["log", "info", "warn", "error"].forEach(function (method) {
        const oldMethod = console[method];
        const loglevel = method.toUpperCase();

        // Override console logging methods
        console[method] = function () {
            // Let Console return us the formatted message, then clear out the chunks
            customConsole[method].apply(this, arguments);
            var formattedLogMsg = Buffer.concat(chunks).toString().replace(/\n$/g, '');
            chunks.length = 0;

            ////////////////////////////////////////////////////////////
            // Log to console, prepending extra fields
            ////////////////////////////////////////////////////////////
            oldMethod.apply(this, [ "[%s] %s %s %s %s", loglevel,
                environment, application, originator, formattedLogMsg ]);

            ////////////////////////////////////////////////////////////
            // If Logz.io logger was created, log to it
            ////////////////////////////////////////////////////////////
            if (logzioLogger) {
                var logzioMsgObj = { level: loglevel };
                if (arguments.length > 1) {
                    // Convert log message from old style to new
                    logzioMsgObj.message = formattedLogMsg;
                } else if (typeof arguments[0] === 'string') {
                    // Convert to JSON-style object
                    logzioMsgObj.message = arguments[0];
                } else if (typeof arguments[0] === 'object') {
                    // Already sent a JSON-style object
                    logzioMsgObj = arguments[0];
                    logzioMsgObj.level = loglevel;
                }

                // Send actual log to Logz.io
                logzioLogger.log(logzioMsgObj);
            }
        };
    });

    // Add ability to flush & close logging since we buffer logs
    console["flushAndClose"] = function (callback) {
        // just a single buffered logger, keep it simple for now
        if (logzioLogger) {
            logzioLogger.sendAndClose(callback);
        } else {
            // call asynchronously callback function with no error
            process.nextTick(callback);
        }
    };

    // Signal this library has been imported
    console.__logger__ = true;
}
