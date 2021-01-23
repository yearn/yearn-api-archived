'use strict';

const handler = require('../../../lib/handler');
require('dotenv').config();

const _ = require('lodash');
const fetch = require('node-fetch');
const Web3 = require('web3');
const delay = require('delay');

const dynamodb = require('../../../utils/dynamoDb');
const yRegistryAbi = require('../../../abi/yRegistry.json');
const vaultAbi = require('../../../abi/vaultV5.json');

const db = dynamodb.doc;
const web3 = new Web3(process.env.WEB3_ENDPOINT_HTTPS);
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const yRegistryAddress = '0x3ee41c098f9666ed2ea246f4d2558010e59d63a0';
const delayTime = 300;

const fetchContractMetadata = async (address) => {
  const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${etherscanApiKey}`;
  const resp = await fetch(url).then((res) => res.json());
  const metadata = resp.result[0];
  await delay(delayTime);
  return metadata;
};

const fetchAliasMetadata = async () => {
  const url =
    'https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/aliases.json';
  const resp = await fetch(url).then((res) => res.json());
  return resp;
};

const fetchContractName = async (address) => {
  const metadata = await fetchContractMetadata(address);
  const contractName = metadata.ContractName;
  return contractName;
};

const getContract = async (address) => {
  const abi = vaultAbi;
  const contract = new web3.eth.Contract(abi, address);
  return contract;
};

const callContractMethod = async (contract, method) => {
  try {
    const result = await contract.methods[method]().call();
    return result;
  } catch (err) {
    console.log('err', method);
    return null;
  }
};

const saveVault = async (vault) => {
  const params = {
    TableName: 'vaults',
    Item: vault,
  };
  if (vault.address === '0xec0d8D3ED5477106c6D4ea27D90a60e594693C90') {
    return;
  }
  await db
    .put(params)
    .promise()
    .catch((err) => console.log('err', err));
  console.log(`Saved ${vault.name}`);
};

module.exports.handler = handler(async () => {
  const registryContract = new web3.eth.Contract(
    yRegistryAbi,
    yRegistryAddress,
  );
  const vaultAddresses = await registryContract.methods.getVaults().call();

  const vaultInfo = await registryContract.methods.getVaultsInfo().call();

  const getVault = async (vaultAddress, idx) => {
    const controllerAddress = vaultInfo.controllerArray[idx];
    const strategyAddress = vaultInfo.strategyArray[idx];
    const vaultContract = await getContract(vaultAddress);
    const vaultName = await callContractMethod(vaultContract, 'name');
    const vaultSymbol = await callContractMethod(vaultContract, 'symbol');
    const tokenAddress = vaultInfo.tokenArray[idx];
    const tokenContract = await getContract(tokenAddress);
    const tokenName = vaultName.substring(6);
    const decimals = parseInt(
      await callContractMethod(vaultContract, 'decimals'),
      10,
    );

    // const tokenSymbolAlias = tokenSymbolAliases[tokenSymbol] || tokenSymbol;
    // const symbolAlias = symbolAliases[vaultSymbol] || `y${tokenSymbolAlias}`;

    const aliasMetadata = await fetchAliasMetadata();

    const vaultAliasMetadata = _.find(aliasMetadata, { address: vaultAddress });
    const vaultSymbolAlias = _.get(vaultAliasMetadata, 'symbol');

    const tokenAliasMetadata = _.find(aliasMetadata, { address: tokenAddress });
    const tokenSymbolAlias = _.get(tokenAliasMetadata, 'symbol');

    const tokenSymbol = await tokenContract.methods.symbol().call();

    const vaultAlias = tokenSymbolAlias || tokenSymbol;

    const tokenIcon = `https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/tokens/${tokenAddress}/logo-128.png`;
    const vaultIcon = `https://raw.githubusercontent.com/iearn-finance/yearn-assets/master/icons/tokens/${vaultAddress}/logo-128.png`;
    const vault = {
      address: vaultAddress,
      name: vaultName,
      vaultAlias,
      vaultIcon,
      symbol: vaultSymbol,
      symbolAlias: vaultSymbolAlias,
      controllerAddress,
      controllerName: await fetchContractName(controllerAddress),
      strategyAddress,
      strategyName: await fetchContractName(strategyAddress),
      tokenAddress,
      tokenName,
      tokenSymbol,
      tokenSymbolAlias: vaultAlias,
      tokenIcon,
      decimals,
      wrapped: vaultInfo.isWrappedArray[idx],
      delegated: vaultInfo.isDelegatedArray[idx],
      timestamp: Date.now(),
    };
    console.log(vault);
    await saveVault(vault);
    return vault;
  };

  const vaults = [];
  let idx = 0;
  const nbrVaults = _.size(vaultAddresses);
  for (idx = 0; idx < nbrVaults; idx++) {
    const vaultAddress = vaultAddresses[idx];
    const vault = await getVault(vaultAddress, idx);
    vaults.push(vault);
  }

  return vaults;
});
