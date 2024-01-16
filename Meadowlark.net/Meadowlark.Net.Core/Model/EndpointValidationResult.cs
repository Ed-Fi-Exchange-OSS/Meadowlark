using Newtonsoft.Json.Linq;

namespace Meadowlark.Net.Core.Model;

/**
 * The result from endpoint validation
 */
public record EndpointValidationResult(

  /**
   * The ResourceSchema for the endpoint, or null if one was not found
   */
  JObject ResourceSchema,

  /**
   * Information on the validated MetaEd entity matching the API request
   */
  ResourceInfo ResourceInfo,

  /**
   * Error message for validation failure
   */
  string? ErrorBody
);
