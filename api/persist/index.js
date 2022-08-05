const CryptoJS = require('crypto-js');
let arc = require('@architect/functions');

let parseBody = arc.http.helpers.bodyParser

const prettyPrintJSON = (json) => {
  console.log(`json value: \n${JSON.stringify(json, null, 4)}`);
}

const formatSalt = (value) => Math.ceil(value * 1000) / 1000;

const checkExisting = async (id) => {
  let tables = await arc.tables()
  console.log(`...checking for existing deck`);
    
  const queryParams = {
    KeyConditionExpression: 'category = :category AND id = :id',
    ExpressionAttributeValues: {
      ':category': 'decks',
      ':id': id,
    }
  }
  
  const response = await tables.data.query(queryParams);
  console.log(`WTF`);
  prettyPrintJSON(response);
  return response?.Items?.length > 0;
}

const persistDeckList = async (body) => {
  console.log(`MD5 HASH => ${CryptoJS.MD5(body?.url)}`);
  const id = `${CryptoJS.MD5(body?.url)}`;
  const urlSlug = body?.url?.substring(body?.url?.lastIndexOf(`/`) + 1);

  console.log(`persisting data for decklist ${body.url}; slug: ${urlSlug}`);
  
  const deckData = {
    category: 'decks',
    id,
    salt: body.salt,
    data: { 
      ...body, 
      dateLastIndexed: ``,
      timesIndexed: ``,
    },
  }

  deckData.data.commanders = deckData.data.commanders;

  try {
    let tables = await arc.tables()
    console.log(`...persisting`);

    const isCached = await checkExisting(id);
    console.log(`isCached: ${isCached}`);

    let response = await tables.data.put({
      ...deckData,
    });

    response = {
      ...response,
      salt: formatSalt(response?.salt),
      data: {
        ...response.data,
        salt: formatSalt(response?.data?.salt),
      }
    }

    prettyPrintJSON(response);

    if (!isCached) {
      console.log(`...incrementing deck count`);

      await tables.data.update({
        Key: { "category": "stats", "id": "stats" },
        ExpressionAttributeValues: { 
          ":inc": 1,
        },
        UpdateExpression: "SET totalCount = totalCount + :inc"
      })
    }

    return response;
  } catch(error) {
    // do nothing
    console.log(`UNABLE TO SET DATA : ${error}`);
  }
}

exports.handler = async function http (requestObject) {
  try {
    const body = parseBody(requestObject); // Pass the entire request object
    const response = await persistDeckList(JSON.parse(body));
    
    return {
      headers: {
        'content-type': 'application/json; charset=utf8',
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'Access-Control-Allow-Headers' : 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
      },
      statusCode: 200,
      body: JSON.stringify(response),
    }
  } catch (error) {
    console.log(`[ERROR] ${error}`);
    return {
      headers: {
        'content-type': 'application/json; charset=utf8',
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'Access-Control-Allow-Headers' : 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
      },
      statusCode: 500,
      body: JSON.stringify({ message: error }),
    }
  }
}

