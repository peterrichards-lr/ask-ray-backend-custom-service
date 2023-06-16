/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

import cors from 'cors';
import { verify } from 'jsonwebtoken';
import jwktopem from 'jwk-to-pem';
import fetch from 'node-fetch';
import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { logger } from './logger.js';

const myEnv: DotenvConfigOutput = dotenv.config();
dotenvExpand.expand(myEnv);

const domains = process.env.CORS_ALLOW_DOMAINS;
if (!domains) {
  throw new Error('The CORS_ALLOW_DOMAINS environment variable was not found!');
}
logger.debug('CORS_ALLOW_DOMAINS', domains);

const lxcDXPMainDomain = process.env.LIFERAY_DXP_MAIN_DOMAIN;
if (!lxcDXPMainDomain) {
  throw new Error(
    'The LIFERAY_DXP_MAIN_DOMAIN environment variable was not found!'
  );
}
logger.debug('LIFERAY_DXP_MAIN_DOMAIN', lxcDXPMainDomain);

const lxcDXPServerProtocol = process.env.LIFERAY_DXP_PROTOCOL;
if (!lxcDXPServerProtocol) {
  throw new Error(
    'The LIFERAY_DXP_PROTOCOL environment variable was not found!'
  );
}
logger.debug('LIFERAY_DXP_PROTOCOL', lxcDXPServerProtocol);

const readyPath = process.env.READY_PATH;
if (!readyPath) {
  throw new Error('The READY_PATH environment variable was not found!');
}
logger.debug('READY_PATH', readyPath);

const oauth2ClientErc = process.env.LIFERAY_OAUTH2_CLIENT_ERC;
logger.debug('LIFERAY_OAUTH2_CLIENT_ERC', oauth2ClientErc);

const allowList = domains
  .split(',')
  .map((domain: any) => `${lxcDXPServerProtocol}://${domain}`);

const corsOptions = {
  origin(origin: any, callback: (arg0: null, arg1: any) => void) {
    callback(null, allowList.includes(origin));
  },
};

export async function corsWithActuator(req: any, res: any, next: any) {
  if (req.path === readyPath) {
    return next();
  }

  return cors(corsOptions)(req, res, next);
}

export async function liferayJWT(req: any, res: any, next: any) {
  if (req.path === readyPath) {
    return next();
  }

  const uriPath = '/o/oauth2/jwks';
  const oauth2JWKSURI = `${lxcDXPServerProtocol}://${lxcDXPMainDomain}${uriPath}`;

  const authorization = req.headers.authorization;

  if (!authorization) {
    res.status(401).send('No authorization header');

    return;
  }

  const [, bearerToken] = req.headers.authorization.split('Bearer ');

  try {
    const jwksResponse = await fetch(oauth2JWKSURI);

    if (jwksResponse.status === 200) {
      const jwks = await jwksResponse.json();

      const jwksPublicKey = jwktopem(jwks.keys[0]);

      const decoded = verify(bearerToken, jwksPublicKey, {
        algorithms: ['RS256'],
        ignoreExpiration: true, // TODO we need to use refresh token
      });

      if (typeof decoded === 'string') {
        res.status(500).send('Unexpected response from verify');
        return;
      }

      if (!oauth2ClientErc) {
        throw new Error(
          'The LIFERAY_OAUTH2_CLIENT_ERC environment variable was not found!'
        );
      }

      const applicationResponse = await fetch(
        `${lxcDXPServerProtocol}://${lxcDXPMainDomain}/o/oauth2/application?externalReferenceCode=${oauth2ClientErc}`
      );

      const { client_id } = await applicationResponse.json();

      if (decoded.client_id === client_id) {
        next();
      } else {
        logger.log(
          'JWT token client_id value does not match expected client_id value.'
        );

        res.status(401).send('Invalid authorization');
      }
    } else {
      logger.error(
        'Error fetching JWKS %s %s',
        jwksResponse.status,
        jwksResponse.statusText
      );

      res.status(401).send('Invalid authorization header');
    }
  } catch (error) {
    logger.error('Error validating JWT token\n%s', error);

    res.status(401).send('Invalid authorization header');
  }
}
