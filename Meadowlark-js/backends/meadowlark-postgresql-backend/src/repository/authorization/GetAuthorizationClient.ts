import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { GetAuthorizationClientRequest, GetAuthorizationClientResult, AuthorizationClientRole } from '@edfi/meadowlark-authz-server';

const selectAuthorizationClientByIdSql = `
  SELECT client_id, client_name, active, roles, client_secret_hashed
  FROM meadowlark.authorizations
  WHERE client_id = $1;`;

export async function getAuthorizationClientDocument(
  { clientId, traceId }: GetAuthorizationClientRequest,
  client: PoolClient,
): Promise<GetAuthorizationClientResult> {
  try {
    const { rows } = await client.query(selectAuthorizationClientByIdSql, [clientId]);

    if (rows.length === 0) return { response: 'GET_FAILURE_NOT_EXISTS' };

    const result = rows[0];

    return {
      response: 'GET_SUCCESS',
      clientName: result.client_name,
      roles: result.roles as AuthorizationClientRole[], // Assuming roles are stored as an array in the database
      active: result.active,
      clientSecretHashed: result.client_secret_hashed,
    };
  } catch (e) {
    Logger.error('GetAuthorizationClient.getAuthorizationClientDocument', traceId, e);
    return { response: 'UNKNOWN_FAILURE' };
  }
}
