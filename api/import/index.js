// const { parseMoxfield } = require('./parsers/Moxfield');
const Moxfield = require('./parsers/moxfield/Moxfield');
const TappedOut = require('./parsers/tappedout/TappedOut');

exports.handler = async function http (requestObject) {
  const url = requestObject.queryStringParameters.url;
  
  let deck;

  try {
    if (url.includes(`moxfield.com`)) {
      deck = await Moxfield.parse(url);
    } else if (url.includes(`tappedout.net`)) {
      deck = await TappedOut.parse(url);
    } else {
      throw ({ message: `Invalid source URL supplied`, code: 500} );
    }
  } catch (error) {
    console.log(JSON.stringify(error));
    console.log(`ERROR !!! ${error.code} :: ${error.message}`);

    return {
      headers: {
        'content-type': 'application/json; charset=utf8',
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'Access-Control-Allow-Headers' : 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
      },
      statusCode: error.code,
      body: JSON.stringify({ message: error.message }),
    }
  }

  return {
    headers: {
      'content-type': 'application/json; charset=utf8',
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'Access-Control-Allow-Headers' : 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
    },
    statusCode: 200,
    body: JSON.stringify({ deck })
  }
}

