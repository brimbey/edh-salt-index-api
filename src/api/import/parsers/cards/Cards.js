const fetch = require('node-fetch');
const arc = require('@architect/functions')
const AWS = require("aws-sdk")
const he = require('he');

const prettyPrintJSON = (json) => {
  console.log(`json value: \n${JSON.stringify(json, null, 4)}`);
}

function fart (data) {
  console.log(`GOT sfs :: `);
  prettyPrintJSON(data);
}


const getEdhrecCardEntry = async (cardname = '') => {
  let cached = null;
  let tables = await arc.tables();
  const category = `cards`;

  try {
    const queryParams = {
      KeyConditionExpression: 'category = :category AND id = :id',
      ExpressionAttributeValues: {
        ':category': category,
        ':id': cardname,
      }
    }
    
    const response = await tables.data.query(queryParams);
    
    if (response.Count > 0) {
      // prettyPrintJSON(response);
      return response.Items[0];
    }
  } catch (error) {
    //
  }

  if (!cached) {
    // console.log(`NOT CACHED :: ${cardname}`);
    const requestOptions = {
      'method': 'GET',
      'hostname': 'cards.edhrec.com',
      'path': `/${cardname}`,
      'headers': {
      },
      'maxRedirects': 20
    };
  
    const response = await fetch(`https://cards.edhrec.com/${cardname}`, requestOptions);
    const text = await response.text();
    const json = JSON.parse(text);

    try {
      return await tables.data.put({
        category: 'cards',
        id: cardname,
        salt: json.salt,
        name: json.name,
      })
    } catch(error) {
      // do nothing
      console.log(`UNABLE TO SET DATA : ${error}`);
    }
  }

  return null;
}

exports.getCard = async (cardname) => {
  try {
    if (cardname?.length < 1) {
      throw ({ message: `Can't find card`, code: 404} );
    }
  
    const sanitizedCardName = he.decode(
      decodeURIComponent(
        cardname?.toLowerCase()
      )
     ).replace(/,|'/g, '')
      .replace(/ /g, '-')
      .replace(/"/g, '')
      .replace(/-\/\/.*/g, '');

    return await getEdhrecCardEntry(sanitizedCardName);
  } catch (error) {
      console.log(`[ERROR] import - can't get card ${cardname}: ${JSON.stringify(error)}`);
  }
}

