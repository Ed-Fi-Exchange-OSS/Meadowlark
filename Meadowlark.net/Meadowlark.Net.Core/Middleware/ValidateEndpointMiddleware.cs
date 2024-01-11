using Meadowlark.Net.Core.Model;
using static Meadowlark.Net.Core.Validation.EndpointValidator;

namespace Meadowlark.Net.Core.Middleware;

public static class ValidateEndpointMiddleware
{
  /**
   * Validates resource endpoint exists
   */
  public static MiddlewareModel EndpointValidation(MiddlewareModel middlewareModel)
  {
    var (requestModel, frontendResponse) = middlewareModel;

    // if there is a response already posted, we are done
    if (frontendResponse != null) return middlewareModel;

    var (ResourceSchema, ResourceInfo, ErrorBody) = ValidateEndpoint(requestModel.ApiSchema, requestModel.PathComponents);

    if (ErrorBody != null)
    {
      var statusCode = ResourceInfo == No.ResourceInfo ? 404 : 400;
      return middlewareModel with { FrontendResponse = new(StatusCode: statusCode, Body: ErrorBody) };
    }

    var updatedMiddlewareModel = middlewareModel with { RequestModel = requestModel with { ResourceSchema = ResourceSchema, ResourceInfo = ResourceInfo } };
    return updatedMiddlewareModel;
  }
}
