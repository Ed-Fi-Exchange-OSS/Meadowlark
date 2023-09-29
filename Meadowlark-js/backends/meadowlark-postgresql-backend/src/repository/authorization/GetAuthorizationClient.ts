import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { GetAuthorizationClientRequest, GetAuthorizationClientResult } from '@edfi/meadowlark-authz-server';
import { getAuthorizationClientDocumentById } from '../SqlHelper';
import { AuthorizationDocument, NoAuthorizationDocument } from '../../model/AuthorizationDocument';

export async function getAuthorizationClientDocument(
  { clientId, traceId }: GetAuthorizationClientRequest,
  client: PoolClient,
): Promise<GetAuthorizationClientResult> {
  try {
    const authorizationClientResult: AuthorizationDocument = await getAuthorizationClientDocumentById(clientId, client);
    if (authorizationClientResult === NoAuthorizationDocument) {
      return { response: 'GET_FAILURE_NOT_EXISTS' };
    }
    const getAuthorizationClientResult: GetAuthorizationClientResult = {
      response: 'GET_SUCCESS',
      clientSecretHashed: authorizationClientResult.clientSecretHashed,
      clientName: authorizationClientResult.clientName,
      active: authorizationClientResult.active,
      roles: authorizationClientResult.roles,
    };
    return getAuthorizationClientResult;
  } catch (e) {
    Logger.error('GetAuthorizationClient.getAuthorizationClientDocument', traceId, e);
    return { response: 'UNKNOWN_FAILURE' };
  }
}
