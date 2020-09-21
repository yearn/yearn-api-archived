const AWS = require("aws-sdk");

module.exports = async (functionName, event, args) => {
  const stage = event.requestContext.stage;

  var lambda = new AWS.Lambda();
  var opts = {
    FunctionName: `yearn-${stage}-${functionName}`,
    Payload: args,
  };

  const invokeLambda = () => {
    return new Promise((resolve, reject) => {
      lambda.invoke(opts, function (err, data) {
        if (err) {
          reject("error while calling another lambda function: " + err);
        } else if (data) {
          const resp = JSON.parse(JSON.parse(data.Payload).body);
          resolve(resp);
        }
      });
    });
  };

  const resp = await invokeLambda();
  return resp;
};
