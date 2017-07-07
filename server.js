'use strict'; 

// const knex = require('knex');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const { DATABASE, PORT } = require('./config');
const jsonParser = bodyParser.json();

const app = express();

app.use(morgan(':method :url :res[location] :status'));

app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT');
  next();
});

app.get('/', (req, res) => {
  res.send('hello world');
});
// ADD ENDPOINTS HERE

app.post('/api/stories', jsonParser, (req, res) => {
  console.log(req.body);
  const requiredFields = ['title', 'url'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  }
  console.log(req.body.url);
  knex('news')
    .insert({'title': req.body.title, 'url': req.body.url})
    .returning(['title', 'url', 'id', 'votes'])
    .then((resultSet) => {
      //console.log(resultSet.json());
      return res.status(201).json(resultSet);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json(err.message);
    });
});

app.get('/api/stories', (req, res) => {
  knex('news')
    .select()
    .orderBy('votes', 'desc')
    .limit(20)
    .then((results) => {
      return res.status(200).json(results);
    });
});

app.put('/api/stories/:id', jsonParser, (req, res) => {
  console.log(req.params.id);
  console.log(req.body.id);
  // if (req.params.id !== req.body.id) {
  //   const message = `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
  //   console.error(message);
  //   return res.status(400).send(message);
  // }
  knex('news')
    .where('id', req.params.id)
    .increment('votes', 1 )
    .then((results) => {return res.status(204).end()
    });
});


let server;
let knex;
function runServer(database = DATABASE, port = PORT) {
  return new Promise((resolve, reject) => {
    try {
      knex = require('knex')(database);
      server = app.listen(port, () => {
        console.info(`App listening on port ${server.address().port}`);
        resolve();
      });
    }
    catch (err) {
      console.error(`Can't start server: ${err}`);
      reject(err);
    }
  });
}

function closeServer() {
  return knex.destroy().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing servers');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => {
    console.error(`Can't start server: ${err}`);
    throw err;
  });
}

module.exports = { app, runServer, closeServer };