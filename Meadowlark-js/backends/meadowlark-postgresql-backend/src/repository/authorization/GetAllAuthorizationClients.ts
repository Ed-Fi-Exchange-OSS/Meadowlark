import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { GetAllAuthorizationClientsResult } from '@edfi/meadowlark-authz-server';
import { getAuthorizationClientDocumentList } from '../SqlHelper';

export async function getAllAuthorizationClientDocuments(
  traceId: string,
  client: PoolClient,
): Promise<GetAllAuthorizationClientsResult> {
  try {
    const getAllAuthorizationClientsResult: GetAllAuthorizationClientsResult =
      await getAuthorizationClientDocumentList(client);

    return getAllAuthorizationClientsResult;
  } catch (e) {
    Logger.error('GetAuthorizationClient.getAuthorizationClientDocument', traceId, e);
    return { response: 'UNKNOWN_FAILURE' };
  }
}
