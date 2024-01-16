using Newtonsoft.Json.Linq;
using Meadowlark.Net.Core.ApiSchema.Model;

namespace Meadowlark.Net.Core.ApiSchema;

public static class ProjectSchemaFinder
{
  /**
   * Finds the ProjectSchema that represents the given ProjectNamespace.
   */
  public static JObject? FindProjectSchema(JObject apiSchema, ProjectNamespace projectNamespace)
  {
    JToken? projectSchema = apiSchema.SelectToken($"$.projectSchemas.{projectNamespace.Value}");
    return (JObject?)projectSchema;
  }
}
