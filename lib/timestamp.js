'use strict';

// Unix timestamp calculator
module.exports = function unix() {
  return Math.floor(Date.now() / 1000);
};
