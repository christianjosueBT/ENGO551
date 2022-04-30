import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import server from './server.js';
import { MongoClient } from 'mongodb';
import ProductsDAO from './dao/productsDAO.js';
import UsersDAO from './dao/usersDAO.js';

const Uri = process.env.URI || 'mongodb://localhost:27017/practice';
const port = process.env.PORT || 2000;

// connecting to mongodb using the mongodb driver!
MongoClient.connect(Uri, {
  useNewUrlParser: true,
  // poolSize: 50,
  wtimeoutMS: 2500,
})
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  })
  .then(async client => {
    await ProductsDAO.injectDB(client);
    await UsersDAO.injectDB(client);

    server.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
  });
