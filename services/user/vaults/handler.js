'use strict';

const handler = require('../../../lib/handler');
const _ = require('lodash');
const { injectDataIntoVaultAtKey } = require('../../../utils/vaults');

const {
  getTransactions,
  getVaultAddressesForUser,
} = require('./transactions/handler');
const { getVaultsStatistics } = require('./statistics/handler');
const { getVaultsApy } = require('../../vaults/apy/handler');
const { getVaults } = require('../../vaults/handler');

module.exports.handler = handler(async (event) => {
  const userAddress = event.pathParameters.userAddress;
  const queryParams = event.queryStringParameters;
  const showTransactions = _.get(queryParams, 'transactions') === 'true';
  const showAllVaults = _.get(queryParams, 'showall') === 'true';
  const showStatistics = _.get(queryParams, 'statistics') === 'true';
  const showApy = _.get(queryParams, 'apy') === 'true';
  const allVaults = await getVaults();

  /**
   * By default only show vaults a user has interacted with.
   * If "showall" query param is true show all vaults.
   */
  const vaultAddressesForUser = await getVaultAddressesForUser(userAddress);
  let vaults = allVaults;
  if (!showAllVaults) {
    const findUserVaults = (vault) =>
      _.includes(vaultAddressesForUser, vault.address.toLowerCase());
    vaults = _.filter(allVaults, findUserVaults);
  }

  // Inject APY into vaults
  const apy = showApy && (await getVaultsApy());
  const injectApy = (vault) => {
    const newVault = injectDataIntoVaultAtKey(vault, apy, 'apy');
    return newVault;
  };

  // Inject statistics into vaults
  const statistics = showStatistics && (await getVaultsStatistics(userAddress));
  const injectStatistics = (vault) => {
    const newVault = injectDataIntoVaultAtKey(vault, statistics, 'statistics');
    return newVault;
  };

  // Inject transactions into vaults at "transactions" key
  const transactions = showTransactions && (await getTransactions(userAddress));
  const injectTransactions = (vault) => {
    const newVault = injectDataIntoVaultAtKey(
      vault,
      transactions,
      'transactions',
    );
    return newVault;
  };

  const userHasVaults = _.size(vaults);
  let vaultsWithData;
  if (userHasVaults) {
    vaultsWithData = _.chain(vaults)
      .map(injectApy)
      .map(injectStatistics)
      .map(injectTransactions);
  } else {
    vaultsWithData = [];
  }

  return vaultsWithData;
});
