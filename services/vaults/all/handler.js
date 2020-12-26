'use strict';

// const _ = require('lodash');

const Web3BatchCall = require('web3-batch-call');
const delay = require('delay');

const handler = require('../../../lib/handler');
const erc20Abi = require('../../../abi/erc20.json');

const vaultInterface = require('../lib/vaults');

// FetchTokenDetails with a batch call to all the available addresses for each
// version. Extracting name, symbol, decimails and the token address.
const fetchVaults = async (client) => {
  const v1Addresses = await vaultInterface.v1.fetchAddresses();
  const v2Addresses = await vaultInterface.v2.fetchAddresses();

  const readMethods = [
    { name: 'name' },
    { name: 'symbol' },
    { name: 'decimals' },
    { name: 'token' },
  ];
  const contracts = [
    {
      namespace: 'v1',
      addresses: v1Addresses,
      abi: vaultInterface.v1.abi(),
      readMethods,
    },
    {
      namespace: 'v2',
      addresses: v2Addresses,
      abi: vaultInterface.v2.abi(),
      readMethods,
    },
  ];

  // Vaults data
  const res = await client.execute(contracts);
  const vaults = res.map(
    ({ address, namespace: type, name, symbol, decimals, token }) => ({
      address,
      type,
      name,
      symbol,
      decimals,
      token: {
        address: token,
      },
    }),
  );

  // Inject inception block from etherscan
  for (const vault of vaults) {
    const { address } = vault;
    const inceptionBlock = await vaultInterface.getInceptionBlock(address);
    await delay(300);
    vault.inceptionBlock = inceptionBlock;
  }

  return vaults;
};

// FetchTokenDetails with a batch call to the ERC20 token addresses inside
// each vault. Extracting name, symbol and decimals.
const fetchTokenDetails = async (client, vaults) => {
  const readMethods = [
    { name: 'name' },
    { name: 'symbol' },
    { name: 'decimals' },
  ];

  const contracts = [
    {
      addresses: vaults.map(({ token }) => token.address),
      abi: erc20Abi,
      readMethods,
    },
  ];

  const res = await client.execute(contracts);
  return Object.fromEntries(res.map((token) => [token.address, token]));
};

module.exports.handler = handler(async () => {
  const provider = process.env.WEB3_ENDPOINT;
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

  const batchClient = new Web3BatchCall({
    provider,
    simplifyResponse: true,
    etherscan: {
      apiKey: etherscanApiKey,
      delay: 300,
    },
  });

  const vaults = await fetchVaults(batchClient);

  // ROI
  const blockStats = await vaultInterface.roi.fetchBlockStats();
  await Promise.all(
    vaults.map(async (vault) => {
      try {
        vault.apy = await vaultInterface.roi.getVaultApy(vault, blockStats);
      } catch {
        vault.apy = {};
      }
    }),
  );

  // Token details & Assets
  const tokenDetails = await fetchTokenDetails(batchClient, vaults);

  const assets = await vaultInterface.assets.fetchAssets();
  const aliases = await vaultInterface.assets.fetchAliases();

  for (const vault of vaults) {
    vault.token = tokenDetails[vault.token.address];

    vault.token.displayName = aliases[vault.token.address] || vault.token.name;
    vault.token.icon = assets[vault.token.address] || null;

    vault.displayName = aliases[vault.address] || vault.name;
    vault.icon = assets[vault.address] || null;
  }

  return vaults;
});
