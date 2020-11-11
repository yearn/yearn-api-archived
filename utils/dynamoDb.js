// The MIT License (MIT)

// Copyright (c) 2016 99X Technology

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Note: File contents copied and modified from serverless-dynamodb-client (https://github.com/99x/serverless-dynamodb-client)
const AWS = require('aws-sdk');

const options = {
    apiVersion: "2012-08-10",
    region: "localhost",
    endpoint: "http://localhost:8000"
};

const isOfflineLocalhost = function () {
    // Depends on serverless-offline plugion which adds IS_OFFLINE to process.env when running offline
    return process.env.IS_OFFLINE && process.env.SERVERLESS_STAGE == "local";
};

const dynamodb = {
    doc: isOfflineLocalhost() ? new AWS.DynamoDB.DocumentClient(options) : new AWS.DynamoDB.DocumentClient(),
    raw: isOfflineLocalhost() ? new AWS.DynamoDB(options) : new AWS.DynamoDB()
};
module.exports = dynamodb;
