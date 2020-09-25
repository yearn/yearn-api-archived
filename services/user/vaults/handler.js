const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const _ = require("lodash");
const {
  getTransactions,
  getVaultAddressesForUser,
} = require("./transactions/handler");
const { getVaultsStatistics } = require("./statistics/handler");
const { getVaultsApy } = require("./../../vaults/apy/handler");
const { getVaults } = require("../../vaults/handler");

module.exports.handler = async (event) => {
  const userAddress = event.pathParameters.userAddress;
  const queryParams = event.queryStringParameters;
  const showTransactions = _.get(queryParams, "transactions") === "true";
  const showAllVaults = _.get(queryParams, "showall") === "true";
  const showStatistics = _.get(queryParams, "statistics") === "true";
  const showApy = _.get(queryParams, "apy") === "true";

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

  // Search a vault data set array (statistics, apy) for data relevant to a specific vault
  const findDataForVault = (data, vault) => {
    const findVault = (dataEntry) =>
      dataEntry.vaultAddress.toLowerCase() === vault.address.toLowerCase();

    const foundData = _.clone(_.find(data, findVault));
    if (foundData) {
      delete foundData.vaultAddress; // Data will be merged. No longer need this key.
    }
    return foundData;
  };

  // Given a vault and a data array, inject data into vault at a specified key
  const injectDataIntoVaultAtKey = (vault, dataToInject, dataKey) => {
    if (!dataToInject) {
      return vault;
    }
    const dataForVault = findDataForVault(dataToInject, vault);
    const newVault = vault;
    newVault[dataKey] = dataForVault;
    return newVault;
  };

  // Merge data into vault. Whitelist fields. If no fields specified, merge all fields.
  const mergeDataIntoVault = (vault, data, fields) => {
    const newVault = vault;
    const dataForVault = findDataForVault(data, vault);
    let newFields = fields;
    if (!fields) {
      newFields = _.keys(dataForVault);
    }
    const mergeField = (acc, field) => {
      acc[field] = dataForVault[field];
      return acc;
    };
    _.reduce(newFields, mergeField, newVault);
    return newVault;
  };

  // Inject APY into vaults
  const apy = showApy && (await getVaultsApy(userAddress));
  const injectApy = (vault) => {
    const fields = [
      "apyOneWeekSample",
      "apyInceptionSample",
      "apyOneMonthSample",
    ];
    if (apy) {
      mergeDataIntoVault(vault, apy, fields);
    }
    return vault;
  };

  // Inject statistics into vaults
  const statistics = showStatistics && (await getVaultsStatistics(userAddress));
  const injectStatistics = (vault) => {
    if (statistics) {
      mergeDataIntoVault(vault, statistics);
    }
    return vault;
  };

  // Inject transactions into vaults at "transactions" key
  const transactions = showTransactions && (await getTransactions(userAddress));
  const injectTransactions = (vault) => {
    const newVault = injectDataIntoVaultAtKey(
      vault,
      transactions,
      "transactions"
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
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(vaultsWithData),
  };
  return response;
};
