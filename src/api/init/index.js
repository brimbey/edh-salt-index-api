const arc = require('@architect/functions');
// const cors = require('cors');

// arc.http.cors

const parseBody = arc.http.helpers.bodyParser;
const AWS = require('aws-sdk');
// const { APIUtils } = require('../common/APIUtils');

const prettyPrintJSON = (json) => {
  console.log(`${JSON.stringify(json, null, 4)}`);
};

const getRecords = async (cursor) => {
  const tables = await arc.tables();
  const category = 'decks';

  const queryParams = {
    Limit: 50,
    IndexName: 'byStats',
    KeyConditionExpression: 'category = :category',
    ProjectionExpression: 'id',
    ExpressionAttributeValues: {
      ':category': category,
    },
  };

  if (cursor) {
    queryParams.ExclusiveStartKey = {
      category: cursor.category,
      id: cursor.id,
    };
  }

  const results = await tables.data.query(queryParams);
  return results;
}

const computeStats = async () => {
  try {
    const tables = await arc.tables();
    let items = [];
    let results;

    do {
      results = await getRecords(results?.LastEvaluatedKey);
      items = items.concat(results?.Items);
    } while (results.LastEvaluatedKey);

    
    await tables.data.put({
        category: 'stats',
        id: 'stats',
        totalCount: items.length,
    });

    return;
  } catch (error) {
    console.log(`UNABLE TO SET DATA : ${error}`);
  }

  return [];
};

exports.handler = async function http(requestObject) {
  const stats = await computeStats();

  return {
    headers: {
      'content-type': 'application/json; charset=utf8',
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'Access-Control-Allow-Headers' : 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
    },
    statusCode: 200,
    body: `Done`,
  };
};
