const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const _ = require("lodash");
const {
  getTransactions,
  getVaultAddressesForUser,
} = require("./transactions/handler");
const { getVaultsStatistics } = require("./statistics/handler");
const { getVaults } = require("../../vaults/handler");

module.exports.handler = async (event) => {
  const userAddress = event.pathParameters.userAddress;
  const queryParams = event.queryStringParameters;
  const showTransactions = _.get(queryParams, "transactions") === "true";
  const showAllVaults = _.get(queryParams, "showall") === "true";
  const showStatistics = _.get(queryParams, "statistics") === "true";

  const allVaults = await getVaults();
  const vaultAddressesForUser = await getVaultAddressesForUser(userAddress);
  let vaults = allVaults;
  if (!showAllVaults) {
    const findUserVaults = (vault) =>
      _.includes(vaultAddressesForUser, vault.address.toLowerCase());
    vaults = _.filter(allVaults, findUserVaults);
  }

  const injectDataIntoVault = (vault, dataToInject, dataKey) => {
    const findVault = (searchVault) => {
      return (
        searchVault.vaultAddress.toLowerCase() === vault.address.toLowerCase()
      );
    };
    const dataForVault = _.clone(_.find(dataToInject, findVault));
    if (dataForVault) {
      delete dataForVault.vaultAddress;
    }
    const newVault = vault;
    newVault[dataKey] = dataForVault;
    return newVault;
  };

  // Inject transactions
  let transactions;
  if (showTransactions) {
    transactions = await getTransactions(userAddress);
  }
  const injectTransactions = (vault) => {
    const newVault = injectDataIntoVault(vault, transactions, "transactions");
    return newVault;
  };

  // Inject statistics
  let statistics;
  if (showStatistics) {
    statistics = await getVaultsStatistics(userAddress);
  }
  const injectStatistics = (vault) => {
    const newVault = injectDataIntoVault(vault, statistics, "statistics");
    return newVault;
  };

  const vaultsWithData = _.chain(vaults)
    .map(injectTransactions)
    .map(injectStatistics);

  const data = {
    transactions,
  };
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
