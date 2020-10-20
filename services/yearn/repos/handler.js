const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });
const _ = require("lodash");

const getRepos = async () => {
  const params = {
    TableName: "repos",
  };
  const entries = await db.scan(params).promise();
  const repos = entries.Items;
  return repos;
};

exports.handler = async (event) => {
  const repos = await getRepos();
  const orderedRepos = _.orderBy(repos, "pushed_at", "desc");
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(orderedRepos),
  };
  return response;
};
