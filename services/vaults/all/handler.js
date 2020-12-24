'use strict';

const _ = require('lodash');

const Web3BatchCall = require('web3-batch-call');
const delay = require('delay');

const handler = require('../../../lib/handler');

const vi = require('../lib/vaults');

module.exports.handler = handler(async () => {
  const v1Addresses = await vi.v1.fetchAddresses();
  const v2Addresses = await vi.v2.fetchAddresses();

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
      abi: vi.v1.abi(),
      readMethods: [{ name: 'name' }, { name: 'symbol' }, { name: 'decimals' }],
    },
    {
      namespace: 'v2',
      addresses: v2Addresses,
      abi: vi.v2.abi(),
      readMethods: [{ name: 'name' }, { name: 'symbol' }, { name: 'decimals' }],
    },
  ];

  // Vaults data
  const res = await batchCall.execute(contracts);
  let vaults = _(res)
    .map(({ address, namespace: type, name, symbol, decimals }) => ({
      address,
      type,
      name: name[0].value,
      symbol: symbol[0].value,
      decimals: decimals[0].value,
    }))
    .value();

  // Inception block
  for (const vault of vaults) {
    const { address } = vault;
    const inceptionBlock = await vi.getInceptionBlock(address);
    await delay(300);
    vault.inceptionBlock = inceptionBlock;
  }

  // ROI
  const blockStats = await vi.roi.fetchBlockStats();
  vaults = await Promise.all(
    vaults.map(async (vault) => {
      let apy = {};
      try {
        apy = await vi.roi.getVaultApy(vault, blockStats);
      } catch {
        apy = {};
      }
      return {
        ...vault,
        apy,
      };
    }),
  );

  return vaults;
});
