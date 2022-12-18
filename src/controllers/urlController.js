const URLModel = require("../models/urlModel");
const axios= require("axios");
const shortid = require('shortid');
const redis = require("redis");
const { promisify } = require("util");
const Validations = require("../validations/validation");
const urlModel = require("../models/urlModel");



//----------------------------< CONNECT WITH REDISH >---------------------------------//

const redisClient = redis.createClient(
  13190,
  "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//--------------------------------< PREPARE >-------------------------------------//

const SET_ASYNC = promisify(redisClient.SETEX).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);





//---------------------------------< CREATE URL >-----------------------------------//

const createURL = async function (req, res) {

 try {
    const data = req.body
    if (Object.keys(data).length == 0) {return res.status(400).send({ status: false, message: "No input provided" });}
    const longUrl  = data
    if (!longUrl) {return res.status(400).send({ status: false, message: "longUrl must be present" })}

    let cahcedProfileData = await GET_ASYNC(`${longUrl}`);
  
    let data1 = JSON.parse(cahcedProfileData);

    if (data1 != null) {return res.status(200).send({ status: true, message: "url is already shorted, data is coming from cache memory", data: data1 }); }

    let urlfound = false;
    let url = { method: 'get', url: longUrl };

    await axios(url)
        .then((result) => {
        if (result.status == 201 || result.status == 200)
        urlfound = true;
        })
        .catch((err) => {});

    if (urlfound == false) return res.status(400).send({ msg: "URL is not correct" })


    
    const urlCode = shortid.generate();

    const shortUrl = "http://localhost:3000" + "/" + urlCode;

    const newUrl = {
        longUrl: longUrl,
        shortUrl: shortUrl,
        urlCode: urlCode
    }
    const createurl = await URLModel.create(newUrl)
    return res.status(200).send({ status: true, data: newUrl })
}
  catch (err) {
    return res.status(500).send({ status: false, message: err.message })
  }
}


//-----------------------------------< GET URL>-------------------------------------//



const getURL = async function (req, res) {
  try {
    let urlCode = req.params.urlCode
   
    if (!urlCode) {return res.status(400).send({ status: false, message: "urlcode is required" })}

    let cahcedProfileData = await GET_ASYNC(`${urlCode}`)
   
     if (cahcedProfileData != null) {
      let data = JSON.parse(cahcedProfileData)
      let longUrl = data.longUrl
      return res.status(302).redirect(longUrl)
     } 
     else {
      let profile = await URLModel.findOne({ urlCode: urlCode });
      if (profile == null) {
        return res.status(404).send({ status: false, message: "urlcode is not registered" })
      }
      let longUrl = profile.longUrl
      await SET_ASYNC(`${urlCode}`,50, JSON.stringify(profile))

      return res.status(302).redirect(longUrl)

    }

  }
  catch (err) {
    return res.status(500).send({ msg: err.message })
  }
}



module.exports = { createURL, getURL }








