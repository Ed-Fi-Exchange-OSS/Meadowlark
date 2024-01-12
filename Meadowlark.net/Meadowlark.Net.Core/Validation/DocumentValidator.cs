using System.Text.Json.Nodes;
using Json.Schema;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Meadowlark.Net.Core.Validation;

public static class DocumentValidator
{

  /**
   * Validate the JSON body of the request against the JSON schema for the corresponding API resource
   */
  public static string[] ValidateDocument(JObject resourceSchema, JObject body)
  {
    JToken? jsonSchemaForResource = resourceSchema.SelectToken("$.jsonSchemaForInsert");
    if (jsonSchemaForResource == null) throw new Exception("No jsonSchemaForInsert found");

    // this is crazy
    string reserializedJsonSchema = JsonConvert.SerializeObject(jsonSchemaForResource);

    // from JsonSchema.Net (json-everything)
    Json.Schema.JsonSchema? schemaValidator = Json.Schema.JsonSchema.FromText(reserializedJsonSchema);
    if (schemaValidator == null) throw new Exception("reserializedJsonSchema not valid");


    // this is also crazy
    string reserializedBody = JsonConvert.SerializeObject(body);
    JsonNode? bodyAsSystemTextJson = JsonNode.Parse(reserializedBody);
    if (bodyAsSystemTextJson == null) throw new Exception("reserializedBody not valid");

    EvaluationResults results = schemaValidator.Evaluate(bodyAsSystemTextJson, new(){OutputFormat = OutputFormat.List});

    var allMessages = results.Details.Where(x => x.HasErrors).SelectMany(x => x.Errors == null ? [] : x.Errors.ToArray()).Select(x => x.Value).ToArray();

    var pruneMessages = results.Details.Where(x => x.HasErrors && x.EvaluationPath.Segments.Count() > 0 && x.EvaluationPath.Segments[^1] == "additionalProperties").Select(x => $"Overpost at {x.InstanceLocation}").ToArray();

    // Remove the unhelpful messages
    return allMessages.Where(x => x != "All values fail against the false schema").Concat(pruneMessages).ToArray();
  }
}
