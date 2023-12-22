using Newtonsoft.Json.Linq;

namespace Meadowlark.Net.Core;
/**
 * An API request sent from the frontend to core
 */
public record FrontendRequest(
    // The requested action from a Meadowlark frontend - GET, POST, PUT, DELETE
    string Action,

    // The URL path in the form /namespace/resource and optionally /resourceId
    // The path must not include query parameters
    string Path,

    // Request body provided by the frontend service as a Json.NET JObject, or null if there is no body
    JObject? Body,

    // A request identifier provided by the frontend service, used for log tracing
    string TraceId
);

