'use strict';

require('dotenv').config();
const Web3BatchCall = require('web3-batch-call');
const delay = require('delay');
const _ = require('lodash');

const unix = require('../../../lib/timestamp');
const handler = require('../../../lib/handler');
const erc20Abi = require('../../../abi/erc20.json');

const vaultInterface = require('../lib/vaults');

const etherscanDelay = 500;

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
  return Object.fromEntries(
    res.map(({ address, name, symbol, decimals }) => [
      address,
      {
        address,
        name,
        symbol,
        decimals,
      },
    ]),
  );
};

// FetchAllVaults with a batch call to all the available addresses for each
// version. Extracting name, symbol, decimails and the token address.
const fetchAllVaults = async (client) => {
  let v1Addresses = await vaultInterface.v1.fetchAddresses();
  let v2Addresses = await vaultInterface.v2.fetchAddresses();

  // TODO: Refactor
  v1Addresses = _.filter(v1Addresses, (address) => {
    return address !== '0xec0d8D3ED5477106c6D4ea27D90a60e594693C90';
  });

  console.log(
    `Fetching ${v1Addresses.length} v1 vaults, ${v2Addresses.length} v2 vaults`,
  );

  const all = [...v1Addresses, ...v2Addresses];
  const cachedVaultsMap = await vaultInterface.cache.fetchCachedVaults(all);

  v1Addresses = v1Addresses.filter((address) => !cachedVaultsMap[address]);
  v2Addresses = v2Addresses.filter((address) => !cachedVaultsMap[address]);

  const cachedVaults = Object.values(cachedVaultsMap);

  console.log(`Cached vaults are ${cachedVaults.length}`);

  if ([...v1Addresses, ...v2Addresses].length === 0) {
    console.log('Skipping vault fetching since all vaults are cached');
    return cachedVaults;
  }

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

  console.log('Fetching new vaults...');

  // Fetch new vaults data
  const res = await client.execute(contracts);
  const newVaults = res.map(
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

  console.log('Injecting `inceptionBlock` into new vaults...');

  // Inject inception block from etherscan
  for (const vault of newVaults) {
    const { address } = vault;
    const inceptionBlock = await vaultInterface.getInceptionBlock(address);
    console.log(`\t-${vault.name}`);
    await delay(etherscanDelay);
    vault.inceptionBlock = inceptionBlock;
  }

  console.log('Injecting `token` into new vaults...');

  // Inject token details
  const tokenDetails = await fetchTokenDetails(client, newVaults);

  for (const vault of newVaults) {
    vault.token = tokenDetails[vault.token.address];
  }

  console.log('Timestamping new vaults...');

  const timestamp = unix();

  // Add timestamps
  for (const vault of newVaults) {
    vault.created = timestamp;
  }

  console.log('Fetched all new vaults!');

  return [...newVaults, ...cachedVaults];
};

module.exports.handler = handler(async () => {
  const provider = process.env.WEB3_ENDPOINT;
  const etherscanApiKey = process.env.ETHERSCAN_API_KEY;

  const client = new Web3BatchCall({
    provider,
    simplifyResponse: true,
    etherscan: {
      apiKey: etherscanApiKey,
      delay: etherscanDelay,
    },
  });

  const vaults = await fetchAllVaults(client);

  // Update ROI and Assets

  // ROI
  const blockStats = await vaultInterface.roi.fetchBlockStats();
  await Promise.all(
    vaults.map(async (vault) => {
      try {
        vault.apy = await vaultInterface.roi.getVaultApy(vault, blockStats);
        console.log('apy', vault.address, blockStats, vault.apy);
      } catch (err) {
        console.error(vault, err);
        vault.apy = {};
      }
    }),
  );

  console.log('Injecting assets in all vaults');

  // Assets
  const assets = await vaultInterface.assets.fetchAssets();
  const symbolAliases = await vaultInterface.assets.fetchSymbolAliases();

  for (const vault of vaults) {
    vault.token = {};
    vault.token.displayName =
      symbolAliases[vault.tokenAddress] || vault.token.symbol;
    // vault.displayName = vault.tokenMetadata.displayName;

    vault.token.icon = assets[vault.tokenAddress] || null;
    console.log('vvv2', vault);
    vault.icon = assets[vault.address] || null;
  }

  console.log('Injecting timestamp in all vaults');

  const timestamp = unix();

  // Add timestamps
  for (const vault of vaults) {
    vault.updated = timestamp;
  }

  console.log('Updating all vaults...');

  // Cache updated & new vaults
  const newVaults = _.map(vaults, (vault) => {
    vault.tokenMetadata = _.clone(vault.token);

    delete vault.token;
    return vault;
  });
  await vaultInterface.cache.cacheVaults(newVaults);

  return {
    message: 'Job executed correctly',
  };
});
