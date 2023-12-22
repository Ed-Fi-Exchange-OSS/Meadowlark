using Meadowlark.Net.Core.Model;
using Meadowlark.Net.Core.Utility;
using static Meadowlark.Net.Core.Middleware.ApiSchemaLoadingMiddleware;
using static Meadowlark.Net.Core.Middleware.ParsePathMiddleware;
using static Meadowlark.Net.Core.Middleware.ValidateEndpointMiddleware;

namespace Meadowlark.Net.Core;


public static class FrontendFacade
{
  /**
   * Entry point for API upsert actions
   */
  public static FrontendResponse UpsertCore(FrontendRequest frontendRequest)
  {
    try
    {
      RequestModel requestModel = new(FrontendRequest: frontendRequest, PathComponents: No.PathComponents, ResourceInfo: No.ResourceInfo,
        ApiSchema: No.ApiSchema, ResourceSchema: No.ResourceSchema);
      MiddlewareModel middlewareModel = new(RequestModel: requestModel, FrontendResponse: null);

      var (finalRequestModel, frontendResponse) = middlewareModel
        .SendTo(LoadApiSchema)
        .AndThen(ParsePath)
        .AndThen(EndpointValidation);

      return frontendResponse ?? new(StatusCode: 200, Body: $"Success: {finalRequestModel.ResourceInfo.ToString()}");
      // return frontendResponse ?? new(StatusCode: 500, Body: "FrontendResponse was null");
    }
    catch (Exception)
    {
      return new(StatusCode: 500, Body: "Fail");
    }
  }
}
