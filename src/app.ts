import express, { Express } from 'express';
import routes from './routes';
import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import actuator from 'express-actuator';

import { logger } from './util/logger';
import {
  corsWitReady,
  liferayJWT,
} from './util/liferay-oauth2-resource-server';

const myEnv: DotenvConfigOutput = dotenv.config();
dotenvExpand.expand(myEnv);

const serverPort = process.env.SERVER_PORT;

const app: Express = express();

app.use(actuator());
app.use(express.json());
app.use(corsWitReady);
app.use(liferayJWT);
app.use(routes);

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

app.listen(serverPort, () =>
  logger.debug(`Server running on http://localhost:${serverPort}`)
);
