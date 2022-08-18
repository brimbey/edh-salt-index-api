const arc = require('@architect/functions');

const prettyPrintJSON = (json) => {
  console.log(`[api.get.commanders]: ${JSON.stringify(json, null, 4)}`);
};

const formatSalt = (value) => Math.ceil(value * 1000) / 1000;

const getQueryStringParams = (parameters) => {
  const paramHash = {};

  if (parameters) {
    Object.keys(parameters).forEach((param) => {
      let decoded = decodeURI(parameters[param]);

      if (param === `cursor`) {
        decoded = `{"${decoded.replace(/=/g, '":"').replace(/&/g, '","')}"}`;
        decoded = JSON.parse(decoded);
      }

      paramHash[param] = decoded;
    });
  }

  return paramHash;
}

const getSaltList = async (parameters) => {
  const cached = null;
  const tables = await arc.tables();
  const category = 'commanders';


  // try {
    const queryParams = {
      Limit: 50,
      IndexName: 'bySearch',
      KeyConditionExpression: 'category = :category',// AND salt > :salt',
      ExpressionAttributeValues: {
        ':category': category,
        // ':salt': 0,
      },
      ScanIndexForward: false,
    };

    if (parameters?.cursor) {
      queryParams.ExclusiveStartKey = {
        category: parameters?.cursor?.category,
        id: parameters?.cursor?.id,
        salt: parseFloat(parameters?.cursor?.salt)
      };
    } 
    prettyPrintJSON(queryParams);

    const results = await tables.data.query(queryParams);

    prettyPrintJSON(results);

    return results;
  // } catch (error) {
  //   console.log(`UNABLE TO GET DATA : ${error}`);
  // }

  return [];
};

exports.handler = async function http(requestObject) {
  const params = getQueryStringParams(requestObject?.queryStringParameters);
  const list = await getSaltList(params);
  console.log(`[api.get.commanders]: WHY`);

  return {
    headers: {
      'content-type': 'application/json; charset=utf8',
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'Access-Control-Allow-Headers' : 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
    },
    statusCode: 200,
    body: JSON.stringify(list),
  };
};
