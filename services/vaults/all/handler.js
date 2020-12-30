'use strict';

const handler = require('../../../lib/handler');

const vaultInterface = require('../lib/vaults');

module.exports.handler = handler(async () => {
  const cached = await vaultInterface.cache.fetchAllCachedVaults();
  return cached;
});
