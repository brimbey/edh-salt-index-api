const CryptoJS = require('crypto-js');
let arc = require('@architect/functions');

let parsedeck = arc.http.helpers.deckParser

const prettyPrintJSON = (json, logType = 'INFO') => {
    console.log(`[Import.Decks][${logType}]: \n${JSON.stringify(json, null, 4)}`);
}

const formatSalt = (value) => Math.ceil(value * 1000) / 1000;

const checkExisting = async (id) => {
  let tables = await arc.tables()
  // console.log(`...checking for existing deck`);
    
  const queryParams = {
    KeyConditionExpression: 'category = :category AND id = :id',
    ExpressionAttributeValues: {
      ':category': 'decks',
      ':id': id,
    }
  }
  
  const response = await tables.data.query(queryParams);
  // prettyPrintJSON(response);
  return response?.Items?.length > 0;
}

const persistDeckList = async (deck) => {
    console.log(`...persisting MD5 HASH => ${CryptoJS.MD5(deck?.url)}`);
    const id = `${CryptoJS.MD5(deck?.url)}`;
    const urlSlug = deck?.url?.substring(deck?.url?.lastIndexOf(`/`) + 1);

    // prettyPrintJSON(deck);

    const deckData = {
        ...deck,
        category: 'decks',
        id,
        commanderHashId: `${CryptoJS.MD5(deck?.commanders?.toString().toUpperCase())}`,
        authorHashId: `${CryptoJS.MD5(deck?.author?.url?.toString().toUpperCase())}`,
        search: {
            author: deck?.author?.userName?.toString()?.toUpperCase(),
            title: deck?.title?.toString()?.toUpperCase(),
            commanders: deck?.commanders?.toString()?.toUpperCase(),
            decksource: deck?.source?.toString()?.toUpperCase(),
        },
    }

    console.log(`[Import.Decks] ...finalized data to store:`);
    prettyPrintJSON(deckData);

    const tables = await arc.tables()
    const isCached = await checkExisting(id);

    const response = await tables.data.put({
        ...deckData,
    });

    console.log(`[Import.Decks] ...dynamodb response:`);
    prettyPrintJSON(response);

    arc.events.publish({
        name: 'ingest',
        payload: { 
            commanderHashId: response?.commanderHashId,
            deckId: response?.id,
            salt: response?.salt,
            operation: isCached ? `update` : `create`,
            commanders: response.commanders,
        }
    }) 

    return response;
}

exports.ingest = async (deck) => {
    try {
       return await persistDeckList(deck);
    } catch (error) {
        prettyPrintJSON(error, 'ERROR');
    }
}
