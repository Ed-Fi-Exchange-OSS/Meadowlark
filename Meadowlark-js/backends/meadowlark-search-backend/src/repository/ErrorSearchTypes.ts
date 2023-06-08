import { OpenSearchClientError, ResponseError as OpenSearchResponseError } from '@opensearch-project/opensearch/lib/errors';
import { ElasticsearchClientError, ResponseError as ElasticSearchResponseError } from '@elastic/transport/lib/errors';

export type ErrorSearch = OpenSearchClientError | ElasticsearchClientError;

export type ResponseErrorSearch = OpenSearchResponseError | ElasticSearchResponseError;
