using Meadowlark.Net.Core.Model;
using Newtonsoft.Json.Linq;
using static Meadowlark.Net.Core.ApiSchema.ProjectSchemaFinder;
using static Meadowlark.Net.Core.ApiSchema.ResourceSchemaFinder;
using Meadowlark.Net.Core.Utility;

namespace Meadowlark.Net.Core.Validation;

public static class EndpointValidator
{
  /**
   * Validates that an EndpointName maps to a ResourceSchema
   */
  public static EndpointValidationResult ValidateEndpoint(JObject apiSchema, PathComponents pathComponents)
  {
    JObject? matchingProjectSchema = FindProjectSchema(apiSchema, pathComponents.ProjectNamespace);
    JObject? matchingResourceSchema = FindResourceSchema(apiSchema, pathComponents);

    if (matchingProjectSchema == null || matchingResourceSchema == null)
    {
      return new(
        ResourceSchema: No.ResourceSchema,
        ResourceInfo: No.ResourceInfo,
        ErrorBody: $"Invalid resource '{pathComponents.EndpointName}'."
      );
    }

    return new(
      ErrorBody: null,
      ResourceSchema: matchingResourceSchema,
      ResourceInfo:
        new(
          ProjectName: new(matchingProjectSchema.PathAsString("$.projectName")),
          ResourceVersion: new(matchingProjectSchema.PathAsString("$.projectVersion")),
          ResourceName: new(matchingResourceSchema.PathAsString("$.resourceName")),
          IsDescriptor: matchingResourceSchema.PathAsBool("$.isDescriptor"),
          AllowIdentityUpdates: matchingResourceSchema.PathAsBool("$.allowIdentityUpdates")
        )
      );
  }
}
