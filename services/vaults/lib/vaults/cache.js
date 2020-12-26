'use strict';

const db = require('../../../../lib/db');

const READ_PAGINATION = 50;
const WRITE_PAGINATION = 50;
const VAULT_TABLE = 'vaultsNew';

module.exports.fetchCachedVaults = async (addresses) => {
  const keys = addresses.map((address) => ({ address }));
  const cached = {};
  for (let i = 0; i < addresses.length; i += READ_PAGINATION) {
    const keySlice = keys.slice(i, READ_PAGINATION);
    const params = {
      RequestItems: {
        [VAULT_TABLE]: {
          Keys: keySlice,
        },
      },
    };
    const { Responses: res } = await db.batchGet(params);
    for (const found of res[VAULT_TABLE]) {
      cached[found.address] = found;
    }
  }
  return cached;
};

module.exports.saveNewVaults = async (vaults) => {
  for (let i = 0; i < vaults.length; i += WRITE_PAGINATION) {
    const vaultsSlice = vaults.slice(i, WRITE_PAGINATION);
    const params = {
      RequestItems: {
        [VAULT_TABLE]: vaultsSlice.map((vault) => ({
          PutRequest: { Item: vault },
        })),
      },
    };
    await db.batchWrite(params);
  }
};
