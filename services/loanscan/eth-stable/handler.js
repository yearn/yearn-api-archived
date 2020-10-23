const dynamodb = require('../../../utils/dynamodb')
const db = dynamodb.doc;
const _ = require("lodash");

module.exports.handler = async (event) => {
  const params = {
    TableName: "vaultApy",
  };
  const entries = await db.scan(params).promise();
  const items = entries.Items;

  const getLoanScanFormat = (item) => {
    const { apyOneDaySample, symbol: tokenSymbol } = item;
    const apy = apyOneDaySample / 100;
    const apr = apy;
    const loanScanData = { apy, apr, tokenSymbol };
    return loanScanData;
  };

  const lendRates = _.map(items, getLoanScanFormat);

  const filteredLendRates = _.filter(lendRates, (vault) => {
    return (
      vault.tokenSymbol === "USDT" ||
      vault.tokenSymbol === "USDC" ||
      vault.tokenSymbol === "TUSD" ||
      vault.tokenSymbol === "DAI" ||
      vault.tokenSymbol === "WETH"
    );
  });

  const fixedLendRates = filteredLendRates.map((rate) => {
    if (rate.tokenSymbol === "WETH") {
      rate.tokenSymbol = "ETH";
    }
    return rate;
  });

  const loanScanResponse = {
    lendRates: fixedLendRates,
  };

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
