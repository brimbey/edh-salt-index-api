const Moxfield = require('./parsers/moxfield/Moxfield');
const TappedOut = require('./parsers/tappedout/TappedOut');
const Archidekt = require('./parsers/archidekt/Archidekt');

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
      default:
        throw ({ message: `Invalid source URL supplied`, code: 500} );
    }
  } catch (error) {
    console.log(`[ERROR]: ${JSON.stringify(error)}`);
    const statusCode = error?.code || 500;
    const body = error?.message ? JSON.stringify({ message: error.message }) : `Unexpected service failure`;

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

