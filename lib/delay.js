'use strict';

// Delay execution with a setTimeout disguised as a promise
module.exports = function delay(ms) {
  return new Promise((res) =>
    setTimeout(() => {
      res();
    }, ms),
  );
};
