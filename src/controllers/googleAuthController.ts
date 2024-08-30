import { JWT, TokenInfo } from 'google-auth-library';
import dotenv, { DotenvConfigOutput } from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import { logger } from '../util/logger';

const config: DotenvConfigOutput = dotenv.config();
dotenvExpand.expand(config);

const keysEnvVar = process.env['GOOGLE_SERVICE_ACCOUNT'];
let hasGoogleServiceAccount = true;
if (keysEnvVar) {
  try {
    const keys = JSON.parse(keysEnvVar);
    const redactedKeys = { ...keys };
    redactedKeys.private_key_id =
      redactedKeys.private_key_id.substr(0, 5) +
      '...' +
      redactedKeys.private_key_id.substr(
        redactedKeys.private_key_id.length - 5
      );
    redactedKeys.private_key =
      redactedKeys.private_key.substr(0, 50) +
      '...' +
      redactedKeys.private_key.substr(redactedKeys.private_key.length - 50);
    logger.debug('GOOGLE_SERVICE_ACCOUNT', redactedKeys);
  } catch (e) {
    hasGoogleServiceAccount = false;
  }
}

const getAuthToken = async (req: any, res: any): Promise<void> => {
  if (!keysEnvVar || !hasGoogleServiceAccount) {
    throw new Error(
      'The GOOGLE_SERVICE_ACCOUNT environment variable was not found!'
    );
  }
  try {
    logger.logRequest(req);
    const jwt = req.jwt;

    if (jwt.scope?.includes('liferay-json-web-services.askray') == false) {
      logger.warn(
        'User does not have the appropriate scope - liferay-json-web-services.askray'
      );
      res.status(401).json({ error: 'invalid_scope' });
      return;
    }

    const keys = JSON.parse(keysEnvVar);
    const client = new JWT({
      email: keys.client_email,
      key: keys.private_key,
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/dialogflow',
      ],
    });
    const url = 'https://www.googleapis.com/auth/dialogflow';
    const authResponse = await client.request({ url });

    if (authResponse.status === 200) {
      const accessToken = client.credentials.access_token;
      if (accessToken) {
        const tokenInfo: TokenInfo = await client.getTokenInfo(accessToken);
        logger.debug('tokenInfo', tokenInfo);
        res.status(200).json({ accessToken });
      } else {
        res.status(500).json({ error: 'No access token was returned' });
        logger.debug('DNS Info:', authResponse.data);
      }
    }
  } catch (error) {
    throw error;
  }
};

export { getAuthToken };
