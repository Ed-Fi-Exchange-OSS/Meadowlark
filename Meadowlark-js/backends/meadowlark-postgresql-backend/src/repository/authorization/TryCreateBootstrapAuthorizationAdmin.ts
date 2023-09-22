import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { CreateAuthorizationClientRequest, TryCreateBootstrapAuthorizationAdminResult } from '@edfi/meadowlark-authz-server';
import { bootstrapAdminDocumentFromCreate } from '../../model/AuthorizationDocument';
import { checkBootstrapAdminExists, insertBootstrapAdmin } from '../SqlHelper';

const functionName = 'postgresql.repository.authorization.tryCreateBootstrapAuthorizationAdminDocument';

export async function tryCreateBootstrapAuthorizationAdminDocument(
  request: CreateAuthorizationClientRequest,
  client: PoolClient,
): Promise<TryCreateBootstrapAuthorizationAdminResult> {
  const createResult: TryCreateBootstrapAuthorizationAdminResult = { response: 'UNKNOWN_FAILURE' };

  try {
    const bootstrapAdminExists: boolean = await checkBootstrapAdminExists(client);

    if (bootstrapAdminExists) {
      Logger.warn(
        `${functionName}: An attempt was made to create a bootstrap Admin ID when one already exists.`,
        request.traceId,
      );
      createResult.response = 'CREATE_FAILURE_ALREADY_EXISTS';
    } else {
      const authorizationClient = bootstrapAdminDocumentFromCreate(request);

      Logger.debug(`${functionName}: Trying insert of admin client id ${request.clientId}`, request.traceId);
      const insertResult: boolean = await insertBootstrapAdmin(authorizationClient, client);

      Logger.debug(`${functionName}: Inserted admin client`, request.traceId);
      if (insertResult) {
        createResult.response = 'CREATE_SUCCESS';
      } else {
        createResult.response = 'UNKNOWN_FAILURE';
      }
    }
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  }

  return createResult;
}
