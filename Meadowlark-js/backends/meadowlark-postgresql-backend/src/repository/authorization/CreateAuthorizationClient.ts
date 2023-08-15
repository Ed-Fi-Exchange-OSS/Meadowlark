import { Logger } from '@edfi/meadowlark-utilities';
import { CreateAuthorizationClientRequest, CreateAuthorizationClientResult } from '@edfi/meadowlark-authz-server';
import { PoolClient } from 'pg';
import { AuthorizationDocument, authorizationDocumentFromCreate } from './Models/AuthorizationDocument';

const functionName = 'postgresql.repository.authorization.createAuthorizationClient';

const insertAuthorizationClientSql = `
  INSERT INTO meadowlark.authorizations (client_id, client_secret_hashed, client_name, roles, is_bootstrap_admin, active)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (client_id) DO UPDATE
  SET client_secret_hashed = EXCLUDED.client_secret_hashed,
      client_name = EXCLUDED.client_name,
      roles = EXCLUDED.roles,
      is_bootstrap_admin = EXCLUDED.is_bootstrap_admin,
      active = EXCLUDED.active;`;

export async function createAuthorizationClientDocument(
    request: CreateAuthorizationClientRequest,
    client: PoolClient,
): Promise<CreateAuthorizationClientResult> {
    const createResult: CreateAuthorizationClientResult = { response: 'UNKNOWN_FAILURE' };

    try {
        await client.query('BEGIN')
        const authorizationClient: AuthorizationDocument = authorizationDocumentFromCreate(request)

        const { rowCount } = await client.query(
            insertAuthorizationClientSql,
            [
                authorizationClient._id,
                authorizationClient.clientSecretHashed,
                authorizationClient.clientName,
                JSON.stringify(authorizationClient.roles),
                authorizationClient.isBootstrapAdmin,
                authorizationClient.active,
            ],
        )

        if (rowCount === 1) {
            createResult.response = 'CREATE_SUCCESS';
        } else {
            const msg = 
                'Error inserting or updating the authorization client in the PostgreSQL database.';
            Logger.error(functionName, request.traceId, msg);
        }

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        Logger.error(functionName, request.traceId, e);
    }

    return createResult;
}