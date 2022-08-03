const fetch = require('node-fetch');
const axios = require('axios').default;
const he = require('he');

const fs = require('fs');
const got = require('got');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const prettyPrintJSON = (json) => {
    console.log(`${JSON.stringify(json, null, 4)}`);
  }

const getcards = (body) => {
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

const getname = (body) => {
  const regex = /(?<=<meta property="og:title" content="MTG Deck: ).*?(?=" \/>)/;
  const match = regex.exec(body);
  const author = match?.[0] || match;

  return he.decode(`${author}`);
}

const getAuthor = (body) => {
  const regex = /(?<=<a href='\/users\/).*?(?=\/'>)/;
  const match = regex.exec(body);

  return he.decode(`${match[0]}`);
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

exports.parse = async (url) => {
    console.log(`USING TAPPEDOUT`);

    var config = {
      method: 'get',
      url,
      headers: { 
        'Cookie': 'csrftoken=457wMlHxdsgLCsLAPpmiyhrjmhniofDDkJ92a5vFwgB1lDr3X4huCcykc9MLlI4p'
      }
    };
    
    // try {
    let cards = [];
    let name = '';
    let author = {
      username: '',
      profileImageUrl: '',
      url: '',
    };
    let legal = true;
    let commanders = [];
    
    await axios(config)
    .then(function (response) {
        // console.log(JSON.stringify(response.data));
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
        // console.log(`FLARGLE: ${body}`);
        
        cards = getcards(body);
        name = getname(body);
        commanders = getCommanders(body);

        author.username = getAuthor(body);
        author.url = `https://tappedout.net/users/${author.username}/`;

        console.log(`name :: ${name}`);
        console.log(`author :: ${author.username}`);
        console.log(`cards :: `);
        
        //TODO: FIX ISSUE WHERE COMMANDERS ARE LISTED IN CARDS AS WELL AS COMMANDERS
    })
    .catch(function (error) {
      console.log(error);
    });
    

    // let response = await fetch(url, requestOptions);
    // const wtf = await response.text();
    // console.log(`GOT :: ${wtf}`);
    // 
    //     
    
    // if (response.status !== 200) {
    //     throw new Error("unable to fetch list!");
    // }

    // let text = await response.text();
    // const json = JSON.parse(text);
    
    // let legal = json?.format === "commander" && json?.mainboardCount === 100;
    // console.log(`legal: ${legal}; format ${json?.format}, count: ${json?.mainboardCount}`);

    // if (!legal) {
    //     throw new Error("commander list has less than 100 cards");
    // }
    
    // if (legal) {
    //     Object.keys(json?.mainboard).forEach((cardname) => {
    //         console.log(`found cardname :: ${cardname}`);
    //         if (json.mainboard[cardname].card?.legalities?.commander !== "legal") {
    //             throw new Error(`FOUND ILLEGAL CARD :: ${cardname}`);
    //         }
    //     })
    // }
    
    return {
        commanders,
        cards,
        author,
        url,
        name,
        legal,
        source: 'tappedout',
    }
}