'use strict';

const fetch = require('node-fetch');

module.exports.v1 = require('./v1');
module.exports.v2 = require('./v2');
module.exports.roi = require('./roi');
module.exports.assets = require('./assets');

const getInceptionBlock = async (vaultAddress) => {
  const params = new URLSearchParams();
  params.append('module', 'account');
  params.append('action', 'txlist');
  params.append('page', '1');
  params.append('offset', '1');
  params.append('address', vaultAddress);
  params.append('apikey', process.env.ETHERSCAN_API_KEY);
  const url = `https://api.etherscan.io/api?${params.toString()}`;
  const response = await fetch(url).then((res) => res.json());
  const result = response.result[0];
  return result.blockNumber;
};

module.exports.getInceptionBlock = getInceptionBlock;
