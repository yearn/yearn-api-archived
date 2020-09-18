const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

exports.handler = async (event) => {
  const params = {
    TableName: "vaultApy",
  };
  const entries = await db.scan(params).promise();
  const items = entries.Items;
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(items),
  };
  return response;
};
