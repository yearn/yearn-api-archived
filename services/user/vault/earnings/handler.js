'use strict';

const handler = require('../../../../lib/handler');
require('dotenv').config();
const vaultsConfig = require('./vaults');
const fetch = require('node-fetch');
const { pluck, uniq } = require('ramda/dist/ramda');
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT_HTTPS);
const subgraphUrl = process.env.SUBGRAPH_ENDPOINT;

async function getActivityData(address) {
  const query = `
  { 
      allDeposits: deposits (where: {account: "${address}"}, orderBy: blockNumber) {
        tx: id
        vaultAddress
        amount
        timestamp
      }
      allWithdrawals: withdraws (where: {account: "${address}"}, orderBy: blockNumber) { 
        tx: id
        vaultAddress
        amount
        timestamp
      }
        allTransfersIn: transfers(where: {to: "${address}", from_not: "0x0000000000000000000000000000000000000000"}, orderBy: blockNumber) {
        tx: id
        from
        to
        shares: value
        timestamp
        vaultAddress
        pricePerFullShare: getPricePerFullShare
        balance
        totalSupply
      }
      allTransfersOut: transfers(where: {from: "${address}", to_not: "0x0000000000000000000000000000000000000000"}, orderBy: blockNumber) {
        tx: id
        from
        to
        shares: value
        timestamp
        vaultAddress
        pricePerFullShare: getPricePerFullShare
        balance
        totalSupply
      }
    }
  `;

  const response = await fetch(subgraphUrl, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });

  const responseJson = await response.json();
  return responseJson.data;
}

async function buildEarningsPerVaultData(address, activityData) {
  let {
    allDeposits,
    allWithdrawals,
    allTransfersIn,
    allTransfersOut,
  } = activityData;

  // Calculate and populate token amounts for transfers
  allTransfersIn = allTransfersIn.map((transfer) => ({
    ...transfer,
    amount: calculateTransferTokenAmount(transfer),
  }));

  allTransfersOut = allTransfersOut.map((transfer) => ({
    ...transfer,
    amount: calculateTransferTokenAmount(transfer),
  }));

  // Use BigNumber for all large numbers to avoid scientific notation.
  allDeposits = convertFieldsToBigNumber(allDeposits, ['amount']);
  allWithdrawals = convertFieldsToBigNumber(allWithdrawals, ['amount']);

  allTransfersIn = convertFieldsToBigNumber(allTransfersIn, [
    'shares',
    'pricePerFullShare',
    'balance',
    'totalSupply',
    'amount',
  ]);

  allTransfersOut = convertFieldsToBigNumber(allTransfersOut, [
    'shares',
    'pricePerFullShare',
    'balance',
    'totalSupply',
    'amount',
  ]);

  // Get all the vaults the address has interacted with.
  const vaultAddresses = uniq([
    ...pluck('vaultAddress', allDeposits),
    ...pluck('vaultAddress', allWithdrawals),
    ...pluck('vaultAddress', allTransfersIn),
    ...pluck('vaultAddress', allTransfersOut),
  ]);

  // Get current holdings for all vaults address has interacted with.
  const allHoldings = await getHoldingsData(address, vaultAddresses);

  // Assemble data into final format including vault metadata, holdings, earned, deposits, withdrawals and transfers.
  // This essentially collates the data per vault, adds totals and removes fields needed up unti now, but that we
  // don't want to return to the API user.
  const earningsByVault = vaultAddresses.map((vaultAddress) => {
    const depositsToVault = allDeposits
      .filter((deposit) => deposit.vaultAddress === vaultAddress)
      .map((deposit) => _.omit(deposit, 'vaultAddress'));

    const withdrawalsFromVault = allWithdrawals
      .filter((withdrawal) => withdrawal.vaultAddress === vaultAddress)
      .map((withdrawal) => _.omit(withdrawal, 'vaultAddress'));

    const transfersIntoVault = allTransfersIn
      .filter((transfer) => transfer.vaultAddress === vaultAddress)
      .map(stripUnneededTransferFields);

    const transfersOutOfVault = allTransfersOut
      .filter((transfer) => transfer.vaultAddress === vaultAddress)
      .map(stripUnneededTransferFields);

    // Calculate deposit and withdrawal totals.
    const totalDepositedToVault = depositsToVault.reduce(
      (totalDeposited, deposit) => totalDeposited.plus(deposit.amount),
      new BigNumber(0),
      depositsToVault,
    );

    const totalWithdrawnFromVault = withdrawalsFromVault.reduce(
      (totalWithdrawn, withdrawl) => totalWithdrawn.plus(withdrawl.amount),
      new BigNumber(0),
      withdrawalsFromVault,
    );

    const totalTransferredIntoVault = transfersIntoVault.reduce(
      (totalTransferred, transfer) => totalTransferred.plus(transfer.amount),
      new BigNumber(0),
      transfersIntoVault,
    );

    const totalTransferredOutOfVault = transfersOutOfVault.reduce(
      (totalTransferred, transfer) => totalTransferred.plus(transfer.amount),
      new BigNumber(0),
      transfersOutOfVault,
    );

    const vaultMetadata = vaultsConfig.find(
      (vaultConfig) =>
        vaultConfig.address.toLowerCase() === vaultAddress.toLowerCase(),
    );

    const holdingsInVault = allHoldings.find(
      (holding) => holding.vaultAddress === vaultAddress,
    ).holdings;

    const vaultEarnings = {
      vault: vaultMetadata,
      earned: holdingsInVault
        .minus(totalDepositedToVault)
        .plus(totalWithdrawnFromVault)
        .minus(totalTransferredIntoVault)
        .plus(totalTransferredOutOfVault)
        .toFixed(0),
      holdings: holdingsInVault.toFixed(0),
      deposits: {
        total: totalDepositedToVault.toFixed(0),
        breakdown: depositsToVault.map(formatBreakdownItem),
      },
      withdrawals: {
        total: totalWithdrawnFromVault.toFixed(0),
        breakdown: withdrawalsFromVault.map(formatBreakdownItem),
      },
      transfersIn: {
        total: totalTransferredIntoVault.toFixed(0),
        breakdown: transfersIntoVault.map(formatBreakdownItem),
      },
      transfersOut: {
        total: totalTransferredOutOfVault.toFixed(0),
        breakdown: transfersOutOfVault.map(formatBreakdownItem),
      },
    };

    return vaultEarnings;
  });

  return earningsByVault;
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

function formatBreakdownItem(breakdownItem) {
  return {
    ...breakdownItem,
    amount: breakdownItem.amount.toFixed(0),
    tx: breakdownItem.tx.slice(0, 66),
  };
}

function calculateTransferTokenAmount(transfer) {
  return (transfer.balance * transfer.shares) / transfer.totalSupply;
}

function convertFieldsToBigNumber(entities, fields) {
  return entities.map((entity) => {
    fields.forEach((field) => {
      entity[field] = new BigNumber(entity[field]);
    });

    return entity;
  });
}

async function getHoldingsData(address, vaultAddresses) {
  // Create and call to vault contracts got get user balances and pricePerFullShares.
  const vaultContracts = {};
  for (const vaultAddress of vaultAddresses) {
    vaultContracts[vaultAddress] = new web3.eth.Contract(
      getMinimalVaultABI(),
      vaultAddress,
    );
  }

  const balanceOfPromises = vaultAddresses.map((vaultAddress) => {
    return vaultContracts[vaultAddress].methods.balanceOf(address).call();
  });

  const pricePromises = vaultAddresses.map((vaultAddress) => {
    return vaultContracts[vaultAddress].methods.getPricePerFullShare().call();
  });

  const [balances, prices] = await Promise.all([
    Promise.all(balanceOfPromises),
    Promise.all(pricePromises),
  ]);

  const allHoldings = vaultAddresses.map((vaultAddress, index) => {
    return {
      vaultAddress,
      holdings: new BigNumber((balances[index] * prices[index]) / 10 ** 18),
    };
  });

  return allHoldings;
}

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

module.exports.handler = handler(async (event) => {
  const userAddress = event.pathParameters.userAddress;

  const activityData = await getActivityData(userAddress);
  const earningsPerVaultData = await buildEarningsPerVaultData(
    userAddress,
    activityData,
  );

  return earningsPerVaultData;
});
