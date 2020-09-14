'use strict';

require('dotenv').config()
const vaultsConfig = require('../../../../config/vaults');
const fetch = require('node-fetch');
const {pluck, uniq} = require('ramda/dist/ramda');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');
const web3 = new Web3(process.env.WEB3_ENDPOINT);

module.exports.handler = async event => {
  const earnings = await getEarningsData(event.pathParameters.id);

  return {
    statusCode: 200,
    body: JSON.stringify(earnings),
  };
};

async function getEarningsData(address) {
  const {allDeposits, allWithdrawals} = await getDepositsAndWithdraws(address);

  // Get all the vaults the address has interacted with.
  const vaultAddresses = uniq([
    ...pluck('vaultAddress', allDeposits),
    ...pluck('vaultAddress', allWithdrawals)
  ]);

  // Get current holdings for all vaults address has interacted with.
  const allHoldings = await getHoldingsData(address, vaultAddresses);

  // assemble data into final format inluding vault metadata, holdings, earned, deposits and withdrawals.
  let earningsByVault = vaultAddresses.map(vaultAddress => {
    // Omit vaultAddress from output, only needed up to this stage to filter deposits and withdrawals by vault.
    // Also format amount for display.
    const depositsToVault = allDeposits
      .filter(deposit => deposit.vaultAddress === vaultAddress)
      .map(deposit => {
        delete(deposit.vaultAddress);
        return {...deposit, amount: deposit.amount.toFixed(0)}
      });

    const withdrawalsFromVault = allWithdrawals
      .filter(withdraw => withdraw.vaultAddress === vaultAddress)
      .map(withdraw => {
        delete(withdraw.vaultAddress);
        return {...withdraw, amount: withdraw.amount.toFixed(0)}
      });

    // Calculate deposit and withdrawal totals.
    const totalDepositedToVault = depositsToVault.reduce((totalDeposited, deposit) => {
      return totalDeposited.plus(deposit.amount);
    }, new BigNumber(0), depositsToVault);

    const totalWithdrawnFromVault = withdrawalsFromVault.reduce((totalWithdrawn, withdrawl) => {
      return totalWithdrawn.plus(withdrawl.amount);
    }, new BigNumber(0), withdrawalsFromVault);

    let vaultMetadata = vaultsConfig.find(vaultConfig => vaultConfig.address.toLowerCase() === vaultAddress.toLowerCase());

    let holdingsInVault = allHoldings.find(holding => holding.vaultAddress === vaultAddress).holdings;
    let vaultEarnings = {
      vault: vaultMetadata,
      earned: holdingsInVault.minus(totalDepositedToVault).plus(totalWithdrawnFromVault).toFixed(0),
      holdings: holdingsInVault.toFixed(0),
      deposits: {
        total: totalDepositedToVault.toFixed(0),
        breakdown: depositsToVault
      },
      withdrawals: {
        total: totalWithdrawnFromVault.toFixed(0),
        breakdown: withdrawalsFromVault
      }
    };

    return vaultEarnings;
  });

  return earningsByVault;
}

async function getDepositsAndWithdraws(address) {
  const query = `
  {
    deposits(where: {account: "${address}"}) {
      tx: id
      vaultAddress
      amount
      timestamp
    }
    withdrawals: withdraws(where: {account: "${address}"}) {
      tx: id
      vaultAddress
      amount
      timestamp
    }
  }
  `;

  const response = await fetch(process.env.SUBGRAPH_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({query})
  });

  let {deposits: allDeposits, withdrawals: allWithdrawals} = (await response.json()).data;

  // Use BigNumber for amounts to avoid scientific notation
  allDeposits = allDeposits.map(deposit => ({...deposit, amount: new BigNumber(deposit.amount)}));
  allWithdrawals = allWithdrawals.map(withdrawal => ({...withdrawal, amount: new BigNumber(withdrawal.amount)}));

  return {allDeposits, allWithdrawals};
}

async function getHoldingsData(address, vaultAddresses) {
  // Create and call to vault contracts got get user balances and pricePerFullShares.
  let vaultContracts = {};
  for (const vaultAddress of vaultAddresses) {
    vaultContracts[vaultAddress] = new web3.eth.Contract(getMinimalVaultABI(), vaultAddress);
  }

  const balanceOfPromises = vaultAddresses.map(vaultAddress => {
      return vaultContracts[vaultAddress].methods.balanceOf(address).call()
    }
  );

  const pricePromises = vaultAddresses.map(vaultAddress => {
      return vaultContracts[vaultAddress].methods.getPricePerFullShare().call()
    }
  );

  const [balances, prices] = await Promise.all([
    Promise.all(balanceOfPromises),
    Promise.all(pricePromises)
  ]);

  const allHoldings = vaultAddresses.map((vaultAddress, index) => {
    return {
      vaultAddress,
      holdings: new BigNumber(balances[index] * prices[index] / 10 ** 18),
    };
  });

  return allHoldings;
}

function getMinimalVaultABI() {
  return [
    {
      "constant": true,
      "inputs": [{"type": "address", "name": "arg0"}],
      "name": "balanceOf",
      "outputs": [{"type": "uint256", "name": "out"}],
      "payable": false,
      "type": "function",
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getPricePerFullShare",
      "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
      "payable": false,
      "type": "function"
    }
  ];
}
