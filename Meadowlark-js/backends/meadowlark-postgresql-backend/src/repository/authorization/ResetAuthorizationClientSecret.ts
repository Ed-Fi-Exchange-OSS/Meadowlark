import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { ResetAuthorizationClientSecretRequest, ResetAuthorizationClientSecretResult } from '@edfi/meadowlark-authz-server';
import { resetAuthorizationClientSecretByClientId } from '../SqlHelper';

const functionName = 'postgresql.repository.authorization.resetAuthorizationClientSecret';

export async function resetAuthorizationClientSecret(
  request: ResetAuthorizationClientSecretRequest,
  client: PoolClient,
): Promise<ResetAuthorizationClientSecretResult> {
  let resetResult: ResetAuthorizationClientSecretResult = { response: 'UNKNOWN_FAILURE' };

  try {
    Logger.debug(`${functionName}: Updating secret for client id ${request.clientId}`, request.traceId);

    resetResult = await resetAuthorizationClientSecretByClientId(request, client);
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  }

  return resetResult;
}
