import { Brand } from '../BrandType';

/**
 * A string type branded as a JsonPath, which is a standard JSONPath expression.
 * See https://goessner.net/articles/JsonPath/index.html
 */

export type JsonPath = Brand<string, 'JsonPath'>;
