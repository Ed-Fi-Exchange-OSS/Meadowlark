import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { Client as ElasticClient } from '@elastic/elasticsearch';

export type ClientSearch = OpenSearchClient | ElasticClient;
