const arc = require('@architect/functions');

const prettyPrintJSON = (json) => {
  console.log(`${JSON.stringify(json, null, 4)}`);
};

const formatSalt = (value) => Math.ceil(value * 1000) / 1000;

const getQueryStringParams = (parameters) => {
  const paramHash = {};

  if (parameters) {
    Object.keys(parameters).forEach((param) => {
      // console.log(`got param ${param}, value: ${parameters[param]}`);
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
  const category = 'decks';

  // prettyPrintJSON(parameters);

  try {
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

    if (parameters?.query || parameters?.sources) {
      // queryParams.IndexName = 'bySearch';
      queryParams.KeyConditionExpression = 'category = :category',
      queryParams.ExpressionAttributeNames = {
        '#node_search': "search",
      };

      queryParams.ExpressionAttributeValues = {
        ':category': category,
      }

      let filterExpression = '';

      if (parameters?.query) {
        queryParams.ExpressionAttributeValues = {
          ...queryParams.ExpressionAttributeValues,
          ':queryString': `${parameters.query.toString().toUpperCase().trim()}`,
        };

        filterExpression = `contains(#node_search.title, :queryString) OR contains(#node_search.commanders, :queryString) OR contains(#node_search.author, :queryString)`;
      }

      if (parameters?.sources) {
        const sourceList = parameters.sources.split(`,`);
        let subFilterExpression = ``;

        for (let i = 0; i < sourceList.length; i++) {
          // console.log(`adding source: ${sourceList[i]}`);

          const expressionAttributeValueName = `:sourceString${i}`;
          queryParams.ExpressionAttributeValues[expressionAttributeValueName] = `${sourceList[i].toString().toUpperCase()}`;
          
          if (i > 0) {
            subFilterExpression = `${subFilterExpression} OR `;
          }

          subFilterExpression = `${subFilterExpression} contains(#node_search.decksource, ${expressionAttributeValueName})`;
        }

        filterExpression = filterExpression ? `(${filterExpression}) AND (${subFilterExpression})` : `${subFilterExpression}`;
      }

      queryParams.FilterExpression = filterExpression;
    }

    // prettyPrintJSON(queryParams);

    const results = await tables.data.query(queryParams);

    // prettyPrintJSON(results);

    return await tables.data.query(queryParams).then((data) => ({
      count: data.Count,
      lastEvaluatedKey: data.LastEvaluatedKey,
      items: data.Items.map((deck) => ({
        ...deck.data,
        id: deck.id,
        salt: formatSalt(deck.data.salt),
        commanders: deck.data?.commanders?.toString()?.replace(/(?<=[a-zA-Z]),(?=[a-zA-Z])/, `\n`),
      })),
    }));
  } catch (error) {
    console.log(`UNABLE TO GET DATA : ${error}`);
  }

  return [];
};

exports.handler = async function http(requestObject) {
  const params = getQueryStringParams(requestObject?.queryStringParameters);
  const list = await getSaltList(params);

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
