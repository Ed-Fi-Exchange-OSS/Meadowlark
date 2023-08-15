import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { GetAllAuthorizationClientsResult, AuthorizationClientRole } from '@edfi/meadowlark-authz-server';

const selectAllAuthorizationClientsSql = `
  SELECT client_id, client_name, active, roles
  FROM meadowlark.authorizations;`;

export async function getAllAuthorizationClientDocuments(
  traceId: string,
  client: PoolClient,
): Promise<GetAllAuthorizationClientsResult> {
  try {
    const { rows } = await client.query(selectAllAuthorizationClientsSql);

    if (rows.length === 0) return { response: 'GET_FAILURE_NOT_EXISTS' };

    return {
      response: 'GET_SUCCESS',
      clients: rows.map((x) => ({
        clientId: x.client_id,
        clientName: x.client_name,
        active: x.active,
        roles: x.roles as AuthorizationClientRole[],  // Assuming roles are stored as an array in the database
      })),
    };
  } catch (e) {
    Logger.error('GetAuthorizationClient.getAuthorizationClientDocument', traceId, e);
    return { response: 'UNKNOWN_FAILURE' };
  }
}
