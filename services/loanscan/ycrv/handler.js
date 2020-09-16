const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const _ = require("lodash");

module.exports.handler = async (event) => {
  const params = {
    TableName: "vaultApy",
  };
  const entries = await db.scan(params).promise();
  const vaults = entries.Items;

  const symbol = "yCRV";
  const assets = ["TUSD", "DAI", "USDT", "USDC"];

  const vault = _.find(vaults, { symbol });
  const { apyLoanscan = 0 } = vault;

  const getLoanscanFormat = (tokenSymbol) => {
    const apy = apyLoanscan / 100;
    const apr = apy;
    const loanScanData = { apy, apr, tokenSymbol };
    return loanScanData;
  };

  const loanScanResponse = _.map(assets, getLoanscanFormat);

  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(loanScanResponse),
  };
  return response;
};
