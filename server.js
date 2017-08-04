const express = require('express');
const googleapis = require('googleapis');
const app = express();
const customsearch = googleapis.customsearch('v1');

const CX = process.env.GCSE_CX;
const API_KEY = process.env.GCSE_API_KEY;

app.get('/favicon.ico', function(request, response) {
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
    response.status(200).send( items );
  });
});

app.get('/latest', (request, response) => {
  response.status(500).send([ { "error" : "error" } ]);
});

// Respond not found to all the wrong routes
app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

// Error Middleware
app.use(function(err, req, res, next) {
  if(err) {
    res.status(err.status || 500)
      .type('txt')
      .send(err.message || 'SERVER ERROR');
  }  
})

app.listen(process.env.PORT, function () {
  console.log('Node.js listening on ' + process.env.PORT + '...');
});
