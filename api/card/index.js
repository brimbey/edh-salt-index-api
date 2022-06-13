import fetch from 'node-fetch';

const prettyPrintJSON = (json) => {
  console.log(`${JSON.stringify(json, null, 4)}`);
}

const getEdhrecCardEntry = async (cardname = '') => {
  const requestOptions = {
    'method': 'GET',
    'hostname': 'cards.edhrec.com',
    'path': '/thassas-oracle',
    'headers': {
    },
    'maxRedirects': 20
  };

  const response = await fetch(`https://cards.edhrec.com/${cardname}`, requestOptions);
  const text = await response.text();
  const json = JSON.parse(text);

  return json;
}

export const handler = async function http (requestObject) {
  const cardname = requestObject?.queryStringParameters?.card;
  console.log(`card api hit with cardname: ${cardname}`);

  if (cardname?.length > 0) {
    const sanitizedCardName = cardname?.toLowerCase()
        .replace(`'`, '')
        .replace(` `, '-');

    const card = await getEdhrecCardEntry(sanitizedCardName);

    return {
      headers: {
        'content-type': 'application/json; charset=utf8',
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
      },
      statusCode: 200,
      body: JSON.stringify({...card})
    }
  } else {
    return {
      headers: {
        'content-type': 'application/json; charset=utf8',
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
      },
      statusCode: 404,
      body: JSON.stringify({ message: `not found` }),
    }
  }
}

