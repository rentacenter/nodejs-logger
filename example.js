'use strict';

// Include custom logger (<environment>, <application>, <originator>)
require('./logger.js')('dev', 'utilities', 'nodejs-logger-test');

// Call standard log methods
console.log('console %s', 'log');
console.info('console %s', 'info');
console.warn('console %s', 'warn');
console.error('console %s', 'error');
console.log('just a string');
console.log({ message: 'logging json', name: 'Troy' });
console.log({ name: '%s' }, { value: 'there' });
console.log('%s', { name: 'Troy'} );
console.warn('washburn');
console.trace('trace message');
console.warn();

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
