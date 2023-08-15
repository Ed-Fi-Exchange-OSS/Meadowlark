import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { UpdateAuthorizationClientRequest, UpdateAuthorizationClientResult } from '@edfi/meadowlark-authz-server';

const functionName = 'postgresql.repository.authorization.updateAuthorizationClientDocument';

const updateSql = `
  UPDATE meadowlark.authorizations
  SET client_name = $1, roles = $2, active = $3
  WHERE client_id = $4
  RETURNING *;
`;

export async function updateAuthorizationClientDocument(
  request: UpdateAuthorizationClientRequest,
  client: PoolClient,
): Promise<UpdateAuthorizationClientResult> {
  const updateResult: UpdateAuthorizationClientResult = { response: 'UNKNOWN_FAILURE' };

  try {
    Logger.debug(`${functionName}: Updating client id ${request.clientId}`, request.traceId);

    const result = await client.query(updateSql, [
      request.clientName,
      JSON.stringify(request.roles),
      request.active,
      request.clientId,
    ]);

    if (result.rowCount === 0) {
      Logger.debug(`${functionName}: client id ${request.clientId} does not exist`, request.traceId);
      updateResult.response = 'UPDATE_FAILED_NOT_EXISTS';
    } else {
      updateResult.response = 'UPDATE_SUCCESS';
    }
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  }

  return updateResult;
}
