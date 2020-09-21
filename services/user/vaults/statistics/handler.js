"use strict";

require("dotenv").config();
const fetch = require("node-fetch");
const { pluck, uniq } = require("ramda/dist/ramda");
const BigNumber = require("bignumber.js");
const subgraphUrl = process.env.SUBGRAPH_ENDPOINT;
const {
  getTransactions,
  getVaultAddressesForUser,
} = require("../transactions/handler");
const _ = require("lodash");

const getVaultStatistics = async (vaultAddress, transactions) => {
  const findVault = (vault) =>
    vault.vaultAddress.toLowerCase() === vaultAddress;
  const transactionsForVault = _.find(transactions, findVault);
  const {
    deposits,
    withdrawals,
    transfersIn,
    transfersOut,
  } = transactionsForVault;

  const getSum = (data) => {
    const zero = new BigNumber(0);
    const sum = data.reduce(
      (dataItem, item) => {
        return dataItem.plus(item.amount);
      },
      zero,
      data
    );
    return sum;
  };

  const totalDeposits = getSum(deposits);
  const totalWithdrawals = getSum(withdrawals);
  const totalTransferredIn = getSum(transfersIn);
  const totalTransferredOut = getSum(transfersOut);

  const earnings = totalDeposits
    .plus(totalWithdrawals)
    .minus(totalTransferredIn)
    .plus(totalTransferredOut);

  const statistics = {
    vaultAddress,
    totalDeposits: totalDeposits.toFixed(),
    totalWithdrawals: totalWithdrawals.toFixed(),
    totalTransferredIn: totalTransferredIn.toFixed(),
    totalTransferredOut: totalTransferredOut.toFixed(),
    earnings: earnings.toFixed(),
  };
  return statistics;
};

const getVaultsStatistics = async (userAddress) => {
  const vaultAddressesForUser = await getVaultAddressesForUser(userAddress);
  const transactions = await getTransactions(userAddress);
  const getVaultStatisticsWithTransactions = async (vault) =>
    await getVaultStatistics(vault, transactions);

  const vaultsStatistics = await Promise.all(
    vaultAddressesForUser.map(getVaultStatisticsWithTransactions)
  );
  return vaultsStatistics;
};

module.exports.handler = async (event) => {
  const userAddress = event.pathParameters.userAddress;
  const vaultsStatistics = await getVaultsStatistics(userAddress);
  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(vaultsStatistics),
  };
};

module.exports.getVaultsStatistics = getVaultsStatistics;
