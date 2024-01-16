using Newtonsoft.Json.Linq;
using static Meadowlark.Net.Core.ApiSchema.ApiSchemaLoader;

namespace Meadowlark.Net.Core.Middleware;

public static class ApiSchemaLoadingMiddleware
{

  public static MiddlewareModel LoadApiSchema(MiddlewareModel middlewareModel)
  {
    var (requestModel, frontendResponse) = middlewareModel;

    // if there is a response already posted, we are done
    if (frontendResponse != null) return middlewareModel;

    JObject apiSchema = LoadApiSchemaFromFile();

    var updatedMiddlewareModel = middlewareModel with { RequestModel = requestModel with { ApiSchema = apiSchema } };
    return updatedMiddlewareModel;
  }
}
