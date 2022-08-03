const fetch = require('node-fetch');
const ImportErrorResponses = require('../../errors/ImportErrorResponses');

const prettyPrintJSON = (json) => {
    console.log(`${JSON.stringify(json, null, 4)}`);
  }

  const getAuthor = (data) => {
    return {
        ...data?.createdByUser,
        username: data?.createdByUser?.userName,
        url: `https://www.moxfield.com/users/${data?.createdByUser?.userName}`,
    }
  }
  
  const getCards = (data) => {
    return data?.mainboard;
  }

  const getCommanders = (data) => {
    return data.commanders;
  }

  const getMetadata = (data) => {
    return {
        url: data?.publicUrl,
        name: data?.name,
        source: 'moxfield',
    }
  }

  const validate = (status, data) => {
    if (status !== 200) {
        throw (ImportErrorResponses.errorStatuses.s404.notFound() );
    }

    let legal = data?.format === "commander" && data?.mainboardCount === 100;

    if (!legal) {
        throw (ImportErrorResponses.errorStatuses.s409.wrongSize());
    } else {
        Object.keys(data?.mainboard).forEach((cardname) => {
            if (data.mainboard[cardname].card?.legalities?.commander !== "legal") {
                throw (ImportErrorResponses.errorStatuses.s409.illegalCard(cardname));
            }
        })
    }
  }

exports.parse = async (url) => {
    const sha = url?.substring(url?.lastIndexOf(`/`) + 1);
    console.log(`USING MOXFIELD`);
    
    const requestOptions = {
        method: 'GET',
        redirect: 'follow',
        'maxRedirects': 20,
    };
    
    const response = await fetch(`https://api.moxfield.com/v2/decks/all/${sha}`, requestOptions);
    const text = await response.text();
    const json = JSON.parse(text);
    
    validate(response.status, json);
    
    return {
        commanders: {
            ...getCommanders(json),
        },
        cards: {
            ...getCommanders(json),
            ...getCards(json),
        },
        author: getAuthor(json),
        ...getMetadata(json),
    }
}