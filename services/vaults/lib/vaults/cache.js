'use strict';

const db = require('../../../../lib/db');

const VAULT_TABLE = 'vaultsNew';

module.exports.fetchCachedVaults = async (addresses) => {
  const keys = addresses.map((address) => ({ address }));
  const cached = await db.batchGet(VAULT_TABLE, keys);
  return Object.fromEntries(cached.map((vault) => [vault.address, vault]));
};

module.exports.fetchAllCachedVaults = async () => {
  const cached = await db.scan(VAULT_TABLE);
  return cached;
};

module.exports.cacheVaults = async (vaults) => {
  await db.batchSet(VAULT_TABLE, vaults);
};
