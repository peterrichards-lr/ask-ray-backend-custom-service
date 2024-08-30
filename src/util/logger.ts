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
import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';

const config: DotenvConfigOutput = dotenv.config();
dotenvExpand.expand(config);

const enableDebug = process.env.ENABLE_DEBUG;

function logRequest(req: any) {
  if (enableDebug) {
    const json = req.body;
    const jwt = req.jwt;
    if (jwt) {
      console.debug(`JWT: ${JSON.stringify(jwt, null, '\t')}`);
      console.debug(`User ${jwt.username} is authorized`);
      console.debug(`User scopes: ${jwt.scope}`);
    } else {
      console.warn('No JWT token');
    }
    console.debug(`json: ${JSON.stringify(json, null, '\t')}`);
  }
}

function logObj(...params: any) {
  if (enableDebug) {
    if (params.length == 0) return;
    else if (params.length == 1)
      console.debug(JSON.stringify(params[0], null, '\t'));
    else if (params.length >= 2) {
      console.debug(params[0], JSON.stringify(params[1], null, '\t'));
    }
  }
}

function logToken(...params: any) {
  if (enableDebug) {
    const tokenCharCount = 10;
    if (params.length == 0) return;
    else if (params.length == 1) {
      const token = params[0];
      console.debug(
        `${token.substring(0, tokenCharCount + 7)} ... ${token.substring(
          token.length - tokenCharCount
        )}`
      );
    } else if (params.length >= 2) {
      const token = params[1];
      console.debug(
        params[0],
        `${token.substring(0, tokenCharCount + 7)} ... ${token.substring(
          token.length - tokenCharCount
        )}`
      );
    }
  }
}

function debug(...params: any) {
  if (enableDebug) console.debug(params);
}

function info(...params: any) {
  console.info(params);
}

function warn(...params: any) {
  console.warn(params);
}

function error(...params: any) {
  console.error(params);
}

export const logger = {
  logRequest,
  logObj,
  logToken,
  debug,
  info,
  warn,
  error,
};
