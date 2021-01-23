'use strict';

require('dotenv').config();

const Web3 = require('web3');

const web3 = new Web3(process.env.WEB3_ENDPOINT_HTTPS);

const oracleMinABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenIn',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amountIn',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'tokenOut',
        type: 'address',
      },
    ],
    name: 'current',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amountOut',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
// festches the token prices from uniquote
exports.getPrice = async (tokenName) => {
  let priceFeed = 0;
  const oracleContract = new web3.eth.Contract(
    oracleMinABI,
    '0x73353801921417f465377c8d898c6f4c0270282c',
  );

  const tokenAddress = [];
  tokenAddress.LINK = '0x514910771af9ca656af840dff83e8264ecf986ca';
  tokenAddress.CRV = '0xd533a949740bb3306d119cc777fa900ba034cd52';
  tokenAddress.YFI = '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e';
  tokenAddress.WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
  tokenAddress.WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  tokenAddress.USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

  const WETHPrice =
    (await oracleContract.methods
      .current(
        tokenAddress.WETH,
        web3.utils.toBN(String(1000000000000000000)),
        tokenAddress.USDC,
      )
      .call()) / 1e6;

  if (tokenName === 'WETH') {
    priceFeed = WETHPrice;
  } else {
    priceFeed =
      ((await oracleContract.methods
        .current(
          tokenAddress[tokenName],
          web3.utils.toBN(String(1000000000000000000)),
          tokenAddress.WETH,
        )
        .call()) /
        1e18) *
      WETHPrice;
  }
  return priceFeed;
};
