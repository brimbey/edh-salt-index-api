const Moxfield = require('./parsers/moxfield/Moxfield');
const TappedOut = require('./parsers/tappedout/TappedOut');
const Archidekt = require('./parsers/archidekt/Archidekt');
const Manabox = require('./parsers/manabox/Manabox');

const CryptoJS = require('crypto-js');
let arc = require('@architect/functions');

const prettyPrintJSON = (json) => {
  console.log(`${JSON.stringify(json, null, 4)}`);
}

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
  prettyPrintJSON(response);
  return response?.Items?.length > 0;
}

const checkAndDeleteDeck = async (url) => {
  console.log(`MD5 HASH => ${CryptoJS.MD5(url)}`);
  const id = `${CryptoJS.MD5(url)}`;
  
  try {
    let tables = await arc.tables()
    console.log(`...checking dead table`);

    const isCached = await checkExisting(id);
    console.log(`isCached: ${isCached}`);

    

    if (isCached) {
      console.log(`deleting old record`);
      await tables.data.delete({
            "category": "decks",
            "id": id,
      }, (err, data) => {
        if (err) console.log(err);
      });
      // prettyPrintJSON(response)


      // console.log(`...decrementing deck count`);

      await tables.data.update({
        Key: { "category": "stats", "id": "stats" },
        ExpressionAttributeValues: { 
          ":inc": 1,
        },
        UpdateExpression: "SET totalCount = totalCount - :inc"
      })
    }

    return;
  } catch(error) {
    // do nothing
    console.log(`UNABLE TO SET DATA : ${error}`);
  }
}

exports.handler = async function http (requestObject) {
  const url = requestObject.queryStringParameters.url;
  const urlObject = new URL(url);
  const hostname = urlObject.hostname;
  const domainName = (hostname.split(`.`).length > 2) ? hostname.replace(/^[^.]+\./g, '') : hostname;

  console.log(`found domainName :: ${domainName}`);

  
  let deck;

  const headers = {
    'content-type': 'application/json; charset=utf8',
    'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
    'Access-Control-Allow-Headers' : 'Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
  };

  try {
    switch (domainName) {
      case `moxfield.com`:
        deck = await Moxfield.parse(url);
        break;
      case `tappedout.net`:
        deck = await TappedOut.parse(url);
        break;
      case `archidekt.com`:
        deck = await Archidekt.parse(url);
        break;
      case `manabox.app`:
        deck = await Manabox.parse(url);
        break;
      default:
        throw ({ message: `Invalid source URL supplied`, code: 500} );
    }
  } catch (error) {
    console.log(`[ERROR]: ${JSON.stringify(error)}`);
    const statusCode = error?.code || 500;
    const body = error?.message ? JSON.stringify({ message: error.message }) : `Unexpected service failure`;

    if (statusCode === 404) {
      await checkAndDeleteDeck(url);
    }

    return {
      headers,
      statusCode,
      body,
    }
  }

  return {
    headers,
    statusCode: 200,
    body: JSON.stringify({ deck })
  }
}

