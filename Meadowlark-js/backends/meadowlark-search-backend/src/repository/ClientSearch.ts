import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { Client as ElasticClient } from '@elastic/elasticsearch';
import { Logger } from '@edfi/meadowlark-utilities';
import { BasicAuth } from '@opensearch-project/opensearch/lib/pool';

export type ClientSearch = OpenSearchClient | ElasticClient;

const moduleName = 'search.repository.Db';

export function newSearchClient(
  searchProvider?: string,
  node?: string,
  auth?: BasicAuth,
  requestTimeout?: number,
): ClientSearch {
  const clientOpts = {
    node,
    auth,
    requestTimeout,
    /* Might need to setup SSL here in the future */
  };
  const masked = { ...clientOpts } as any;
  delete masked.auth?.password;

  try {
    switch (searchProvider) {
      case 'ElasticSearch': {
        return new ElasticClient(clientOpts);
      }
      case 'OpenSearch':
      default: {
        return new OpenSearchClient(clientOpts);
      }
    }
  } catch (e) {
    Logger.error(`${moduleName}.getSearchClient error connecting with options ${JSON.stringify(masked)}`, null, e);
    throw e;
  }
}
