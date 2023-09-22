import { PoolClient } from 'pg';
import { Logger } from '@edfi/meadowlark-utilities';
import { GetAuthorizationClientRequest, GetAuthorizationClientResult } from '@edfi/meadowlark-authz-server';
import { getAuthorizationClientDocumentById } from '../SqlHelper';

export async function getAuthorizationClientDocument(
  { clientId, traceId }: GetAuthorizationClientRequest,
  client: PoolClient,
): Promise<GetAuthorizationClientResult> {
  try {
    const getAuthorizationClientResult: GetAuthorizationClientResult = await getAuthorizationClientDocumentById(
      clientId,
      client,
    );
    return getAuthorizationClientResult;
  } catch (e) {
    Logger.error('GetAuthorizationClient.getAuthorizationClientDocument', traceId, e);
    return { response: 'UNKNOWN_FAILURE' };
  }
}
