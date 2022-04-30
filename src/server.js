// my ip address: 192.168.1.64
import { URL, fileURLToPath } from 'url';
import express from 'express';
import serverTiming from 'server-timing';
import https from 'https';
import cors from 'cors';
import fs from 'fs';
import productsAPI from './api/products.routes.js';
import usersAPI from './api/users.routes.js';
import home from '../views/routes/home.routes.js';
import users from '../views/routes/users.routes.js';
import cookieParser from '../middleware/cookieParser.js';

const key = fs.readFileSync('../cert/CA/localhost/localhost+2-key.pem');
const cert = fs.readFileSync('../cert/CA/localhost/localhost+2.pem');
const __public = fileURLToPath(new URL('../public', import.meta.url));

const app = express();
const corsOptions = {
  origin: [
    'https://localhost:2000',
    'https://chris-desktop:2000',
    'https://192.168.1.64',
  ],
  credentials: true,
  allowedHeaders: 'Content-Type,Authorization,Refresh',
};

app.use(cookieParser);
app.use(serverTiming());
app.use(cors(corsOptions));
app.use(express.static(__public));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(methodOverride('_method'));
// app.use(session(sessionConfig));

// server timing setup
// app.use((req, res, next) => {
//   res.startTime('file', 'File IO metric');
//   next();
// });

// Register api routes
app.use('/', home);
app.use('/users', users);
app.use('/api/v1/products', productsAPI);
app.use('/api/v1/users', usersAPI);
app.use('*', (req, res) => res.status(404).json({ error: 'not found' }));
const server = https.createServer({ key, cert }, app);

export default server;
