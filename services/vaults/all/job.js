'use strict';

require('dotenv').config();

const { providers } = require('ethers');
const yearn = require('@yfi/sdk');

const unix = require('../../../lib/timestamp');
const handler = require('../../../lib/handler');
const db = require('../../../lib/db');

const plimit = require('p-limit');

const limit = plimit(2);

const VAULT_TABLE = 'vaultsNew';

// FetchAllVaults with a batch call to all the available addresses for each
// version. Extracting name, symbol, decimails and the token address.
const fetchAllVaults = async (ctx) => {
  let v1Addresses = await yearn.vault.fetchV1Addresses(ctx);
  let v2Addresses = await yearn.vault.fetchV2Addresses(ctx);
  let v2ExperimentalAddresses = await yearn.vault.fetchV2ExperimentalAddresses(
    ctx,
  );

  // TODO: Refactor
  v1Addresses = v1Addresses.filter((address) => {
    return address !== '0xec0d8D3ED5477106c6D4ea27D90a60e594693C90';
  });

  v2Addresses = v2Addresses.filter((address) => {
    return ![
      '0xBFa4D8AA6d8a379aBFe7793399D3DdaCC5bBECBB',
      '0xe2F6b9773BF3A015E2aA70741Bde1498bdB9425b',
    ].includes(address);
  });

  v2ExperimentalAddresses = v2ExperimentalAddresses.filter((address) => {
    return !v2Addresses.includes(address);
  });

  console.log(
    'Fetching',
    v1Addresses.length,
    'v1 vaults',
    v2Addresses.length,
    'v2 vaults',
    v2ExperimentalAddresses.length,
    'v2 experimental vaults',
  );

  const vaults = await Promise.all(
    v1Addresses
      .map((address) =>
        limit(async () => await yearn.vault.resolveV1(address, ctx)),
      )
      .concat(
        v2Addresses.map((address) =>
          limit(async () => {
            const vault = await yearn.vault.resolveV2(address, ctx);
            return { ...vault, endorsed: true };
          }),
        ),
      )
      .concat(
        v2ExperimentalAddresses.map((address) =>
          limit(async () => {
            const vault = await yearn.vault.resolveV2(address, ctx);
            return { ...vault, endorsed: false };
          }),
        ),
      ),
  );

  return vaults;
};

module.exports.handler = handler(async () => {
  const provider = new providers.WebSocketProvider(
    process.env.WEB3_ENDPOINT_WSS,
  );
  const etherscan = process.env.ETHERSCAN_API_KEY;
  const ctx = new yearn.Context({ provider, etherscan });

  const vaults = await fetchAllVaults(ctx);

  // ROI
  await Promise.all(
    vaults.map((vault) =>
      limit(async () => {
        try {
          vault.apy = await yearn.vault.calculateApy(vault, ctx);
        } catch (err) {
          console.error(vault, err);
          vault.apy = {};
        }
      }),
    ),
  );

  console.log('Injecting assets in all vaults');

  // Assets
  const assets = await yearn.data.assets.fetchAssets();
  const aliases = await yearn.data.assets.fetchAliases();

  for (const vault of vaults) {
    const alias = aliases[vault.token.address];
    vault.token.displayName = alias ? alias.symbol : vault.token.symbol;
    vault.displayName = vault.token.displayName;
    vault.token.icon = assets[vault.token.address] || null;
    vault.icon = assets[vault.address] || null;
  }

  console.log('Injecting timestamp in all vaults');

  const timestamp = unix();

  // Add timestamps
  for (const vault of vaults) {
    vault.updated = timestamp;
  }

  console.log('Updating all vaults...');

  // FIXME: remove
  const newVaults = vaults.map((vault) => {
    vault.tokenMetadata = Object.assign({}, vault.token);
    vault.tokenAddress = vault.tokenMetadata.address;

    delete vault.token;
    return vault;
  });

  await db.batchSet(VAULT_TABLE, newVaults);

  return {
    message: 'Job executed correctly',
  };
});
