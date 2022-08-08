const fetch = require('node-fetch');
const axios = require('axios').default;
const ImportErrorResponses = require('../../errors/ImportErrorResponses');

const prettyPrintJSON = (json) => {
    console.log(`${JSON.stringify(json, null, 4)}`);
  }

  const getAuthor = (data) => {
    return {
        profileImageUrl: ``,
        username: ``,
        url: ``,
    }
  }
  
  const getCards = (data) => {
    const cards = {};
    data?.cards?.forEach((item) => {
        const name = item?.name;
        
        if (name) {
            cards[name] = name;
        }
    });

    return cards;
  }

  const getCommanders = (data) => {
    const cards = {};
    data?.cards?.forEach((item) => {
        if (item?.boardCategory === 2) {
            const name = item?.name;
            if (name) {
                cards[name] = name;
            }
        }
    });

    return cards;
  }

  const getMetadata = (data) => {
    return {
        url: data?.url,
        name: data?.name,
        source: `https://manabox.app`,
    }
  }

  const validate = (status, data) => {
    if (status !== 200) {
        throw (ImportErrorResponses.errorStatuses.s404.notFound());
    }

    let legal = data?.format === 4;
    
    if (!legal) {
        throw (ImportErrorResponses.errorStatuses.s409.genericIllegal());
    }
  }

exports.parse = async (url) => {
    console.log(`USING MANABOX`);
    console.log(`url :: ${url}`);
    const regex = /(?<=\.app\/decks\/).*/;
    const match = regex.exec(url);
    prettyPrintJSON(match);
    const id = match[0];
    
    const requestOptions = {
        method: 'GET',
        redirect: 'follow',
        'maxRedirects': 20,
    };
    
    var config = {
        method: 'get',
        url: `https://cloud.manabox.app/decks/${id}`,
        headers: { }
      };
      
    const response = await axios(config);
    const json = response.data;

    validate(response.status, json);

    return {
        commanders: {
            ...getCommanders(json),
        },
        cards: {
            ...getCards(json),
        },
        author: getAuthor(json),
        ...getMetadata({
            ...json,
            url,
        }),
    }
}