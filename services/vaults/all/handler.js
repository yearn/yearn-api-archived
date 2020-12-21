'use strict';

const _ = require('lodash');

const handler = require('../../../lib/handler');

const { getVaults } = require('../handler');
const { getVaultsV2 } = require('../v2/handler');

const V2_KEYMAP = {
  vault: 'address',
  vaultName: 'name',
  vaultSymbol: 'symbol',
  vaultDecimals: 'decimals',
};

module.exports.handler = handler(async () => {
  const v1 = _(await getVaults())
    .map((val) => _.pick(val, ['address', 'name', 'symbol', 'decimals']))
    .map((val) => _.assign({}, val, { type: 'v1' }))
    .value();

  const v2 = _(await getVaultsV2())
    .map((val) => _.mapKeys(val, (__, k) => V2_KEYMAP[k]))
    .map((val) => _.pick(val, ['address', 'name', 'symbol', 'decimals']))
    .map((val) => _.assign({}, val, { type: 'v2' }))
    .value();
  return _.merge(v1, v2);
});
