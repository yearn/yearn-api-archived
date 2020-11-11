'use strict';

const _ = require('lodash');
const { getVaults } = require('../handler');

module.exports.handler = async () => {
  const vaults = await getVaults();
  const addresses = _.map(vaults, 'address');
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(addresses),
  };
};
