const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

const getVaults = async () => {
  const params = {
    TableName: "vaults",
  };
  const entries = await db.scan(params).promise();
  const vaults = entries.Items;
  return vaults;
};

exports.getVaults = getVaults;

exports.handler = async (event) => {
  const allVaults = await getVaults();
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(allVaults),
  };
  return response;
};
