'use strict'

const express = require('express');
const mongodb = require('mongodb');
const googleapis = require('googleapis');
const app = express();
const customsearch = googleapis.customsearch('v1');

const DATABASE_URI = 'mongodb://user:' + process.env.MONGOPASS + '@ds147872.mlab.com:47872/freecodecamp';
const DATABASE_COLLECTION = 'fcc-image-search-abstraction-layer';

const CX = process.env.GCSE_CX;
const API_KEY = process.env.GCSE_API_KEY;

let database;

app.get('/favicon.ico', (request, response) => {
  response.status(204).end();
});

app.get('/search/:searchstring', (request, response) => {
  let pageNumber = request.query.offset || 1;
  customsearch.cse.list( { 
    cx: CX,
    q: request.params.searchstring,
    auth: API_KEY,
    searchType: 'image',
    num: 10,
    start: Number(pageNumber),
  }, (error, apiresponse) => {
    if (error) {
      return response.status(500).send( { "error" : error } );
    }
    let items = apiresponse.items || [];
    items = items.map( (item) => {
      return {
        "image_url" : item.link,
        "snippet" : item.snippet,
        "page_url" : item.image.contextLink,
      };
    });

    let collection = database.collection(DATABASE_COLLECTION);
    collection.save( {
      "search_term" : request.params.searchstring,
      "time" : new Date().toISOString(),
    });

    response.status(200).send( items );
  });
});

app.get('/latest', (request, response) => {
  let collection = database.collection(DATABASE_COLLECTION);
  let thing = collection.find({}, {"_id": false}).limit(10).sort({"_id" : -1}).toArray().then((documents) => {
    response.status(200).send(documents);
  }).catch( (error) => {
    response.status(500).send(error);
  });
});

// Respond not found to all the wrong routes
app.use( (req, res, next) => {
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use( (err, req, res, next) => {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
});

mongodb.MongoClient.connect(DATABASE_URI, (error, db) => {
  if (error) throw error;

  database = db;
  app.listen(process.env.PORT, () => {
    console.log('Node.js listening on ' + process.env.PORT + '...');
  });
});
