'use strict';

const handler = require('../../../lib/handler');
const _ = require('lodash');
const { getVaults } = require('../handler');

module.exports.handler = handler(async () => {
  const vaults = await getVaults();
  const addresses = _.map(vaults, 'address');
  return addresses;
});
