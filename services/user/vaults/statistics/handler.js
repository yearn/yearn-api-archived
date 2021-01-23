'use strict';

const handler = require('../../../../lib/handler');
require('dotenv').config();
const BigNumber = require('bignumber.js');
const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT_HTTPS);

const {
  getTransactions,
  getVaultAddressesForUser,
} = require('../transactions/handler');
const _ = require('lodash');

const getVaultContract = (vaultAddress) => {
  const abi = getMinimalVaultABI();
  const contract = new web3.eth.Contract(abi, vaultAddress);
  return contract;
};

const getDepositedShares = async (vaultContract, userAddress) => {
  const balance = await vaultContract.methods.balanceOf(userAddress).call();
  return balance;
};

const getPricePerFullShare = async (vaultContract) => {
  const pricePerFullShare = await vaultContract.methods
    .getPricePerFullShare()
    .call();
  return pricePerFullShare;
};

const getVaultStatistics = async (vaultAddress, transactions, userAddress) => {
  const findVault = (vault) =>
    vault.vaultAddress.toLowerCase() === vaultAddress;
  const transactionsForVault = _.find(transactions, findVault);

  const vaultContract = getVaultContract(vaultAddress);
  const depositedShares = await getDepositedShares(vaultContract, userAddress);

  const pricePerFullShare = await getPricePerFullShare(vaultContract);

  const depositedAmount = new BigNumber(depositedShares)
    .times(pricePerFullShare)
    .dividedBy(10 ** 18);

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
      data,
    );
    return sum;
  };

  const totalDeposits = getSum(deposits);
  const totalWithdrawals = getSum(withdrawals);
  const totalTransferredIn = getSum(transfersIn);
  const totalTransferredOut = getSum(transfersOut);

  const earnings = depositedAmount
    .minus(totalDeposits)
    .plus(totalWithdrawals)
    .minus(totalTransferredIn)
    .plus(totalTransferredOut);

  const statistics = {
    vaultAddress,
    totalDeposits: totalDeposits.toFixed(),
    totalWithdrawals: totalWithdrawals.toFixed(),
    totalTransferredIn: totalTransferredIn.toFixed(),
    totalTransferredOut: totalTransferredOut.toFixed(),
    depositedShares,
    depositedAmount: depositedAmount.toFixed(0),
    earnings: earnings.toFixed(0),
  };
  return statistics;
};

const getVaultsStatistics = async (userAddress) => {
  const vaultAddressesForUser = await getVaultAddressesForUser(userAddress);
  const transactions = await getTransactions(userAddress);
  const getVaultStatisticsWithTransactions = async (vault) =>
    await getVaultStatistics(vault, transactions, userAddress);

  const vaultsStatistics = await Promise.all(
    vaultAddressesForUser.map(getVaultStatisticsWithTransactions),
  );
  return vaultsStatistics;
};

function getMinimalVaultABI() {
  return [
    {
      constant: true,
      inputs: [{ type: 'address', name: 'arg0' }],
      name: 'balanceOf',
      outputs: [{ type: 'uint256', name: 'out' }],
      payable: false,
      type: 'function',
    },
    {
      constant: true,
      inputs: [],
      name: 'getPricePerFullShare',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      payable: false,
      type: 'function',
    },
  ];
}

module.exports.getVaultsStatistics = getVaultsStatistics;

module.exports.handler = handler(async (event) => {
  const userAddress = event.pathParameters.userAddress;
  const vaultsStatistics = await getVaultsStatistics(userAddress);
  return vaultsStatistics;
});
