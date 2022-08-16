const axios = require('axios').default;
const he = require('he');
const ImportErrorResponses = require('../../errors/ImportErrorResponses');

const prettyPrintJSON = (json) => {
    console.log(`${JSON.stringify(json, null, 4)}`);
  }

const getCards = (body) => {
  const cards = {};
  const regex = /(?<=<input type="hidden" name="c" value=").*?(?=")/;
  const match = regex.exec(body);

  let names = match[0].split(`||`);
  
  names.forEach((name) => {
      const cardname = he.decode(`${name.substring(name.indexOf(" ") +1)}`);
      cards[cardname] = cardname;
  })

  return cards;
}

const getAuthor = (body) => {
  const regex = /(?<=<a href='\/users\/).*?(?=\/'>)/;
  const match = regex.exec(body);
  const author = he.decode(`${match[0]}`);

  return {
    username: author,
    url: `https://tappedout.net/users/${author}/`,
  }
}

const getCommanders = (body) => {
  const regex = /(?<=<a rel="popover" class="card-hover").*?(?=class="commander-img)/;
  const match = regex.exec(body);

  const commanders = {};

  match.forEach((item) => {
    console.log(`... found ${item}`);
    const cardRegex = /(?<=data-name=").*?(?=")/;
    const name = he.decode(`${cardRegex.exec(item)?.[0] || ''}`);
    commanders[name] = {
      card: {
        name,
      }
    }
  })
  return commanders;
}

const getMetadata = (data) => {
  const regex = /(?<=<meta property="og:title" content="MTG Deck: ).*?(?=" \/>)/;
  const match = regex.exec(data);
  const title = he.decode(`${ match?.[0] || match }`);

  return {
      url: ``,
      name: title,
      source: 'http://www.tappedout.net',
  }
}

const validate = (status, data) => {
  if (status !== 200) {
      throw (ImportErrorResponses.errorStatuses.s404.notFound() );
  }

  const index = data.indexOf(`<p style='color: green'>This deck is Commander / EDH legal.</p></td>`);
  let legal = index > -1;

  if (!legal) {
      throw (ImportErrorResponses.errorStatuses.s409.genericIllegal());
  }
}

exports.parse = async (url) => {
    console.log(`USING TAPPEDOUT`);

    var config = {
      method: 'get',
      url,
      headers: { 
        'Cookie': 'csrftoken=457wMlHxdsgLCsLAPpmiyhrjmhniofDDkJ92a5vFwgB1lDr3X4huCcykc9MLlI4p'
      }
    };
    
    const response = await axios(config);
    let body = JSON.stringify(response.data);
        
    body = body.replace(/\\"/gm, '"')
      .replace(/&#x27;/gm, "'")
      .replace(/\\r/gm, "")
      .replace(/\\n/gm, "")
      .replace(/  /gm, " ")
      .replace(/  /gm, " ")
      .replace(/  /gm, " ")
      .replace(/  /gm, " ")
      .replace(/  /gm, " ")
      .replace(/  /gm, " ")
      .replace(/  /gm, " ")
      .replace(/  /gm, " ")
      .replace(/\\t/gm, "");

    validate(response.status, body);
    
    return {
        commanders: getCommanders(body),
        cards: getCards(body),
        author: getAuthor(body),
        ...getMetadata(body),
        url,
    }
}