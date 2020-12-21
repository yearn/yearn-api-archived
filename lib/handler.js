'use strict';

// Handler wrapper for AWS lambda functions
module.exports = function handler(lambda) {
  return async function (event, context) {
    let body;
    let statusCode;

    // catch any errors thrown in execution ..
    try {
      body = await lambda(event, context);
      statusCode = 200;
    } catch (e) {
      // .. and format them in an HTTP-friendly way
      console.error(e);
      body = { error: e.message || 'Unexpected error.' };
      statusCode = e.statusCode || 500;
    }

    return {
      statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };
  };
};
