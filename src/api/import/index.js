const Moxfield = require('./parsers/moxfield/Moxfield');
const TappedOut = require('./parsers/tappedout/TappedOut');
const Archidekt = require('./parsers/archidekt/Archidekt');
const Manabox = require('./parsers/manabox/Manabox');
const Cards = require('./parsers/cards/Cards');
const Decks = require('./decks/Decks');

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
  //prettyPrintJSON(response);
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

const fetchCardInList = async (name, finishedCallback) => {
  try {
    const card = await Cards.getCard(name);

    if (card) {
      // prettyPrintJSON(card);
      finishedCallback(card);
    }
  } catch (error) {
      console.log(`failed to get ${name} ${error}`);
      finishedCallback({})
  }
};

const buildDeckData = async (url, domainName) => {
  let deck;

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

  let cards = [];
  let salt = 0.00;

  // prettyPrintJSON(deck);
  const names = Object.keys(deck?.cards);

  const deckData = {
    commanders: Object.keys(deck?.commanders), //getCommanders(body),
    cards: Object.keys(deck?.cards), //
    author: deck.author,
    url: deck.url,
    name: deck.name,
    title: deck.name,
    source: deck.source,
    salt: 0,
  };

  const fetchFinishedHandler = async (card) => {
    if (card?.salt && card?.salt > 0) {
      deckData.salt = deckData.salt + parseFloat(card?.salt);
    }
  }

  const promises = [];
  for (let i = 0; i < deckData?.cards?.length; i++) {
    const name = deckData?.cards?.[i];

    promises.push(fetchCardInList(name, fetchFinishedHandler));
  }

  await Promise.all(promises);
  const finalData = await Decks.ingest(deckData);

  return finalData;
};

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
    deck = await buildDeckData(url, domainName);
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
    body: JSON.stringify({deck })
  }
}

