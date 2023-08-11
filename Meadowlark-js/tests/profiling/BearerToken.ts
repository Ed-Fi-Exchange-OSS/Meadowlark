import axios from 'axios';

/**
 * Uses hardcoded admin credentials to create a new client and get a bearer token.
 *
 * @param urlPrefix The url prefix of the OAuth endpoint that comes before "/oauth/"
 */
export async function getBearerToken(urlPrefix: string): Promise<string> {
  // Authenticate hardcoded admin
  const authenticateAdminResult = await axios.post(
    `${urlPrefix}/local/oauth/token`,
    {
      grant_type: 'client_credentials',
      client_id: 'meadowlark_admin_key_1',
      client_secret: 'meadowlark_admin_secret_1',
    },
    {
      headers: { 'content-type': 'application/json' },
    },
  );

  const adminToken = authenticateAdminResult.data.access_token;

  // Create client
  const createClientResult = await axios.post(
    `${urlPrefix}/local/oauth/clients`,
    {
      clientName: 'SIS',
      roles: ['vendor'],
    },
    {
      headers: { 'content-type': 'application/json', Authorization: `bearer ${adminToken}` },
    },
  );

  const clientId = createClientResult.data.client_id;
  const clientSecret = createClientResult.data.client_secret;

  // Authenticate client
  const authenticateClientResult = await axios.post(
    `${urlPrefix}/local/oauth/token`,
    {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    },
    {
      headers: { 'content-type': 'application/json' },
    },
  );

  return authenticateClientResult.data.access_token;
}
