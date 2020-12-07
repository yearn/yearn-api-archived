'use strict';

const _ = require('lodash');

// Search a vault data set array (statistics, apy) for data relevant to a specific vault
const findDataForVault = (data, vault) => {
  const findVault = (dataEntry) => {
    const searchAddress = dataEntry.address || dataEntry.vaultAddress;
    return searchAddress.toLowerCase() === vault.address.toLowerCase();
  };

  const foundData = _.clone(_.find(data, findVault));
  if (foundData) {
    delete foundData.vaultAddress; // Data will be merged. No longer need this key.
  }
  return foundData;
};

// Given a vault and a data array, inject data into vault at a specified key
module.exports.injectDataIntoVaultAtKey = (vault, dataToInject, dataKey) => {
  if (!dataToInject) {
    return vault;
  }
  const dataForVault = findDataForVault(dataToInject, vault);
  const newVault = vault;
  newVault[dataKey] = dataForVault;
  return newVault;
};
