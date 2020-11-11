'use strict';

require('dotenv').config();
const fetch = require('node-fetch');
const { pluck, uniq } = require('ramda/dist/ramda');
const { getVaults } = require('../../../vaults/handler');
const _ = require('lodash');

const subgraphUrl = process.env.SUBGRAPH_ENDPOINT;

module.exports.handler = async (event) => {
  const userAddress = event.pathParameters.userAddress;
  const transactions = await getTransactions(userAddress);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(transactions),
  };
};

const getGraphTransactions = async (userAddress) => {
  const query = `
  { 
      deposits: deposits (where: {account: "${userAddress}"}, orderBy: blockNumber) {
        transactionAddress: id
        vaultAddress
        amount
        timestamp
      }
      withdrawals: withdraws (where: {account: "${userAddress}"}, orderBy: blockNumber) { 
        transactionAddress: id
        vaultAddress
        amount
        timestamp
      }
      transfersIn: transfers(where: {to: "${userAddress}", from_not: "0x0000000000000000000000000000000000000000"}, orderBy: blockNumber) {
        transactionAddress: id
        timestamp
        vaultAddress
        balance
        totalSupply
        shares: value
      }
      transfersOut: transfers(where: {from: "${userAddress}", to_not: "0x0000000000000000000000000000000000000000"}, orderBy: blockNumber) {
        transactionAddress: id
        shares: value
        vaultAddress
        timestamp
        balance
        totalSupply
        shares: value
      }
    }
  `;

  const response = await fetch(subgraphUrl, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

  const responseJson = await response.json();
  const graphTransactions = responseJson.data;
  return graphTransactions;
};

const getVaultAddressesForUserWithGraphTransactions = (
  userAddress,
  graphTransactions,
) => {
  const {
    deposits,
    withdrawals,
    transfersIn,
    transfersOut,
  } = graphTransactions;
  const vaultAddressesForUser = uniq([
    ...pluck('vaultAddress', deposits),
    ...pluck('vaultAddress', withdrawals),
    ...pluck('vaultAddress', transfersIn),
    ...pluck('vaultAddress', transfersOut),
  ]);
  return vaultAddressesForUser;
};

const getVaultAddressesForUser = async (userAddress) => {
  const graphTransactions = await getGraphTransactions(userAddress);
  const vaultAddressesForUser = getVaultAddressesForUserWithGraphTransactions(
    userAddress,
    graphTransactions,
  );
  return vaultAddressesForUser;
};

const getTransactions = async (userAddress) => {
  const graphTransactions = await getGraphTransactions(userAddress);
  const { deposits, withdrawals } = graphTransactions;
  let { transfersIn, transfersOut } = graphTransactions;

  const injectAmountIntoTransfer = (transfer) => {
    const amount = (transfer.balance * transfer.shares) / transfer.totalSupply;
    const newTransfer = {
      ...transfer,
      amount,
    };
    return newTransfer;
  };

  transfersIn = transfersIn.map(injectAmountIntoTransfer);
  transfersOut = transfersOut.map(injectAmountIntoTransfer);

  // Get all the vaults the address has interacted with.
  const vaultAddresses = getVaultAddressesForUserWithGraphTransactions(
    userAddress,
    graphTransactions,
  );

  const vaults = await getVaults();

  const removeVaultAddressField = (deposit) => _.omit(deposit, 'vaultAddress');

  const getTransactionsByVaultAddress = (vaultAddress) => {
    const findItemByVaultAddress = (item) => item.vaultAddress === vaultAddress;

    const findVault = (vault) =>
      vault.address.toLowerCase() === vaultAddress.toLowerCase();

    const depositsToVault = deposits
      .filter(findItemByVaultAddress)
      .map(removeVaultAddressField);

    const withdrawalsFromVault = withdrawals
      .filter(findItemByVaultAddress)
      .map(removeVaultAddressField);

    const transfersIntoVault = transfersIn
      .filter(findItemByVaultAddress)
      .map(stripUnneededTransferFields);

    const transfersOutOfVault = transfersOut
      .filter(findItemByVaultAddress)
      .map(stripUnneededTransferFields);

    const vault = vaults.find(findVault);

    const vaultTransactions = {
      vaultAddress: vault.address,
      deposits: depositsToVault.map(correctTransactionAddress),
      withdrawals: withdrawalsFromVault.map(correctTransactionAddress),
      transfersIn: transfersIntoVault.map(correctTransactionAddress),
      transfersOut: transfersOutOfVault.map(correctTransactionAddress),
    };

    return vaultTransactions;
  };

  const transactionsByVault = vaultAddresses.map(getTransactionsByVaultAddress);
  return transactionsByVault;
};

function correctTransactionAddress(item) {
  return {
    ...item,
    transactionAddress: item.transactionAddress.slice(0, 66),
  };
}

function stripUnneededTransferFields(transfer) {
  return _.omit(transfer, [
    'vaultAddress',
    'shares',
    'pricePerFullShare',
    'totalSupply',
    'balance',
  ]);
}

module.exports.getTransactions = getTransactions;

module.exports.getVaultAddressesForUser = getVaultAddressesForUser;
