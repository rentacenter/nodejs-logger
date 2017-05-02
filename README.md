# Node.js Logging Library

The purpose of this simple library is to uncouple the logging implementation from the applications.

When instantiating this logging library, you will supply *environment*, *application*, and *originator* values that will get included in every log event.  In addition, the log level will also be included in the output.

The current library prints all log events both to the console (stdout or stderr, depending on log level) and to Logz.io

```


## Install Dependencies

```
$ npm install
```

## Usage

```
// Include custom logger (<environment>, <application>, <originator>)
require('./logger.js')('dev', 'utilities', 'nodejs-logger-test');

// Call standard log methods
console.warn('this is my log message');

// If method exists (meaning we sourced custom logger), flush logs.
// Do this before exiting the application or ending the Lambda function.
console.flushAndClose && console.flushAndClose(function (err) {
    if (err) {
        // of course this log may not get sent remotely
        console.error('error: ' + err);
    } else {
        // of course this log may not get sent remotely
        console.info('successfully flushed');
    }
    // signal end-of-execution now
});

```

produces to console:

```
[WARN] dev utilities nodejs-logger-test this is my log message
```

and produces to Logz.io:

```
{
  "type": "nodejs",
  "environment": "dev",
  "application": "utilities"
  "originator": "nodejs-logger-test",
  "level": "WARN",
  "message": "this is my log message",
  "@timestamp_nano": "2017-05-02T18:49:42.583Z-261388-666866490",
}
```

## Examples

```
$ ENV LOGZIO_TOKEN=<token> LOGZIO_DEBUG=true node example.js
```
