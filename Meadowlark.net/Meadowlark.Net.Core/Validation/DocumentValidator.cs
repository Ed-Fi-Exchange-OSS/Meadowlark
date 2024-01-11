using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NJsonSchema;

namespace Meadowlark.Net.Core.Validation;

public static class DocumentValidator
{

  /**
   * Validate the JSON body of the request against the JSON schema for the corresponding API resource
   */
  public static async Task<string[]> ValidateDocument(JObject resourceSchema, JObject body)
  {
    JToken? jsonSchemaForResource = resourceSchema.SelectToken("$.jsonSchemaForInsert");
    if (jsonSchemaForResource == null) throw new Exception("No jsonSchemaForInsert found");

    // this is crazy
    string reserializedJsonSchema = JsonConvert.SerializeObject(jsonSchemaForResource);
    var schemaValidator = await JsonSchema.FromJsonAsync(reserializedJsonSchema);
    var validationErrors = schemaValidator.Validate(body);

    if (validationErrors.Count == 0) return [];

    return validationErrors.Select(x => $"Path: {x.Path} and Kind: {x.Kind}").ToArray();
  }
}
