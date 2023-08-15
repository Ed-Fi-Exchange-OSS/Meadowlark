import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { CreateAuthorizationClientRequest, TryCreateBootstrapAuthorizationAdminResult } from '@edfi/meadowlark-authz-server';
import { bootstrapAdminDocumentFromCreate } from './Models/AuthorizationDocument';

const functionName = 'postgresql.repository.authorization.tryCreateBootstrapAuthorizationAdminDocument';

const checkBootstrapAdminExistsSql = `
  SELECT * 
  FROM meadowlark.authorizations
  WHERE is_bootstrap_admin = true;
`;

const insertBootstrapAdminSql = `
  INSERT INTO meadowlark.authorizations(client_id, client_secret_hashed, client_name, roles, is_bootstrap_admin, active)
  VALUES($1, $2, $3, $4, $5, $6);
`;

export async function tryCreateBootstrapAuthorizationAdminDocument(
  request: CreateAuthorizationClientRequest,
  client: PoolClient,
): Promise<TryCreateBootstrapAuthorizationAdminResult> {
  const createResult: TryCreateBootstrapAuthorizationAdminResult = { response: 'UNKNOWN_FAILURE' };

  try {
    const { rowCount: bootstrapAdminExists } = await client.query(checkBootstrapAdminExistsSql);

    if (bootstrapAdminExists > 0) {
      Logger.warn(
        `${functionName}: An attempt was made to create a bootstrap Admin ID when one already exists.`,
        request.traceId,
      );
      createResult.response = 'CREATE_FAILURE_ALREADY_EXISTS';
    } else {
      const authorizationClient = bootstrapAdminDocumentFromCreate(request);

      Logger.debug(`${functionName}: Trying insert of admin client id ${request.clientId}`, request.traceId);

      await client.query(insertBootstrapAdminSql, [
        authorizationClient._id,
        authorizationClient.clientSecretHashed,
        authorizationClient.clientName,
        JSON.stringify(authorizationClient.roles),
        authorizationClient.isBootstrapAdmin,
        authorizationClient.active,
      ]);

      Logger.debug(`${functionName}: Inserted admin client`, request.traceId);
      createResult.response = 'CREATE_SUCCESS';
    }
  } catch (e) {
    Logger.error(functionName, request.traceId, e);
  } 

  return createResult;
}
