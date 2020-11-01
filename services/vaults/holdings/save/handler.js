require("dotenv").config();
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const Web3 = require("web3");
const moment = require("moment");
const delay = require("delay");
const _ = require("lodash");
const vaults = require("./vaults");
const EthDater = require("./ethereum-block-by-date.js");
const { delayTime } = require("./config");
const poolABI = require("./abis/pool");
const {getHoldings} = require('./getHoldings');
const archiveNodeUrl = process.env.ARCHIVENODE_ENDPOINT;
const infuraUrl = process.env.WEB3_ENDPOINT;
const archiveNodeWeb3 = new Web3(archiveNodeUrl);
const infuraWeb3 = new Web3(infuraUrl);
const blocks = new EthDater(archiveNodeWeb3, delayTime);

AWS.config.update({
  endpoint: "http://localhost:8000"
});

const pools = [
  {
    symbol: "yCRV",
    address: "0x45F783CCE6B7FF23B2ab2D70e416cdb7D6055f51",
  },
  {
    symbol: "crvBUSD",
    address: "0x79a8C46DeA5aDa233ABaFFD40F3A0A2B1e5A4F27",
  },
  {
    symbol: "crvBTC",
    address: "0x7fC77b5c7614E1533320Ea6DDc2Eb61fa00A9714",
  },
];

const saveVault = async (data) => {
  const params = {
    TableName: "vaultApy",
    Item: data,
  };
  await db
    .put(params)
    .promise()
    .catch((err) => console.log("err", err));
  console.log(`Saved ${data.name}`);
};



  const vaultContract = new archiveNodeWeb3.eth.Contract(abi, address);

const readVault = async (vault) => {
  const {
    name,
    symbol,
    description,
    vaultSymbol,
    vaultContractABI: abi,
    vaultContractAddress: address,
    erc20address: tokenAddress,
  } = vault;
  console.log(`Reading vault ${vault.name}`);
  if (!abi || !address) {
    console.log(`Vault ABI not found: ${name}`);
    return null;
  }
  const strategyHoldings= await getHoldings(vault);
 
  console.log("Vault: ", name, apy);
  const data = {
    address,
    name,
    symbol,
    timestamp: Date.now(),
    vaultHoldings,
    strategyHoldings,
  };
  await saveVault(data);
  return data;
};

module.exports.handler = async (context) => {
  console.log("Fetching historical blocks");
  currentBlockNbr = await infuraWeb3.eth.getBlockNumber();
  await delay(delayTime);
  oneDayAgoBlock = (await blocks.getDate(oneDayAgo)).block;
  threeDaysAgoBlock = (await blocks.getDate(threeDaysAgo)).block;
  oneWeekAgoBlock = (await blocks.getDate(oneWeekAgo)).block;
  oneMonthAgoBlock = (await blocks.getDate(oneMonthAgo)).block;
  nbrBlocksInDay = currentBlockNbr - oneDayAgoBlock;
  console.log("Done fetching historical blocks");

  const vaultsWithApy = [];
  for (const vault of vaults) {
    const vaultWithApy = await readVault(vault);
    if (vaultWithApy !== null) {
      vaultsWithApy.push(vaultWithApy);
    }
    await delay(delayTime);
  }
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(vaultsWithApy),
  };
  return response;
};
