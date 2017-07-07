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

app.get('/', (req, res) => {
  res.send('hello world');
});
// ADD ENDPOINTS HERE

app.post('/api/stories', jsonParser, (req,res) => {
  const requiredFields = ['title', 'url'];
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `Missing \`${field}\` in request body`
      console.error(message);
      return res.status(400).send(message);
    }
  }
  knex('news')
    .update('title', 'url')
    .where('title', 'text')
    .andWhere('url', 'text')
    .then((resultSet) => {
        return res.status(201).json(resultSet);
    })
    .catch(err => {
        console.error(err);
        return res.status(500).json(err.message);
    })
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