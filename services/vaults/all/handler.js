'use strict';

const _ = require('lodash');

const Web3BatchCall = require('web3-batch-call');

const handler = require('../../../lib/handler');

const v1 = require('../lib/v1');
const v2 = require('../lib/v2');

module.exports.handler = handler(async () => {
  const v1Addresses = await v1.fetchAddresses();
  const v2Addresses = await v2.fetchAddresses();

  // TODO: ugly
  const provider = process.env.WEB3_ENDPOINT;
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

  const batchCall = new Web3BatchCall({
    provider,
    etherscan: {
      apiKey: etherscanApiKey,
      delay: 300,
    },
  });

  const contracts = [
    {
      namespace: 'v1',
      addresses: v1Addresses,
      abi: v1.abi(),
      readMethods: [{ name: 'name' }, { name: 'symbol' }, { name: 'decimals' }],
    },
    {
      namespace: 'v2',
      addresses: v2Addresses,
      abi: v2.abi(),
      readMethods: [{ name: 'name' }, { name: 'symbol' }, { name: 'decimals' }],
    },
  ];

  const res = await batchCall.execute(contracts);
  const data = _(res).map(
    ({ address, namespace: type, name, symbol, decimals }) => ({
      address,
      type,
      name: name[0].value,
      symbol: symbol[0].value,
      decimals: decimals[0].value,
    }),
  );

  return data;
});
