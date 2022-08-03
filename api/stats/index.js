const arc = require('@architect/functions');
const cors = require('cors');

// arc.http.cors

const parseBody = arc.http.helpers.bodyParser;
const AWS = require('aws-sdk');
// const { APIUtils } = require('../common/APIUtils');

const prettyPrintJSON = (json) => {
  console.log(`${JSON.stringify(json, null, 4)}`);
};

const getStatsObject = async (cursor) => {
  const cached = null;
  const tables = await arc.tables();
  const category = 'stats';

  try {
    const queryParams = {
      IndexName: 'byStats',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': category,
      },
    };

    const results = await tables.data.query(queryParams);
    console.log(`got stats!`);
    prettyPrintJSON(results);
    return results;
  } catch (error) {
    console.log(`UNABLE TO GET DATA : ${error}`);
  }

  return [];
};

exports.handler = async function http(requestObject) {
  const stats = await getStatsObject();

  return {
    headers: {
      'content-type': 'application/json; charset=utf8',
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'Access-Control-Allow-Headers' : 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
    },
    statusCode: 200,
    body: JSON.stringify(stats),
  };
};
