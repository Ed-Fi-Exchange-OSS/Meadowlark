import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { ResetAuthorizationClientSecretRequest, ResetAuthorizationClientSecretResult } from '@edfi/meadowlark-authz-server';

const functionName = 'postgresql.repository.authorization.resetAuthorizationClientSecret';
const resetAuthorizationClientSecretSql = `
  UPDATE meadowlark.authorizations
  SET client_secret_hashed = $1
  WHERE client_id = $2
  RETURNING *;`;

export async function resetAuthorizationClientSecret(
  request: ResetAuthorizationClientSecretRequest,
  client: PoolClient,
): Promise<ResetAuthorizationClientSecretResult> {
  const resetResult: ResetAuthorizationClientSecretResult = { response: 'UNKNOWN_FAILURE' };

  try {
    Logger.debug(`${functionName}: Updating secret for client id ${request.clientId}`, request.traceId);

    const { rowCount } = await client.query(resetAuthorizationClientSecretSql, [
      request.clientSecretHashed,
      request.clientId,
    ]);

    if (rowCount === 0) {
      Logger.debug(`${functionName}: client id ${request.clientId} does not exist`, request.traceId);
      resetResult.response = 'RESET_FAILED_NOT_EXISTS';
    } else {
      resetResult.response = 'RESET_SUCCESS';
    }
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  } 

  return resetResult;
}
