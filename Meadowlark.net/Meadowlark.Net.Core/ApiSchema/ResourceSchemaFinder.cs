using Newtonsoft.Json.Linq;
using static Meadowlark.Net.Core.ApiSchema.ProjectSchemaFinder;
using Meadowlark.Net.Core.Model;

namespace Meadowlark.Net.Core.ApiSchema;

public static class ResourceSchemaFinder
{

  /**
   * Finds the ResourceSchema that represents the given REST resource path.
   */
  public static JObject? FindResourceSchema(JObject apiSchema, PathComponents pathComponents)
  {
    JObject? projectSchema = FindProjectSchema(apiSchema, pathComponents.ProjectNamespace);
    if (projectSchema == null) return null;
    
    JToken? resourceSchema = projectSchema.SelectToken($"resourceSchemas.{pathComponents.EndpointName.Value}");
    return (JObject?)resourceSchema;
  }
}
