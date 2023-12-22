using Meadowlark.Net.Core.Model;
using Meadowlark.Net.Core.Utility;
using static Meadowlark.Net.Core.Middleware.ApiSchemaLoadingMiddleware;
using static Meadowlark.Net.Core.Middleware.ParsePathMiddleware;
using static Meadowlark.Net.Core.Middleware.ValidateEndpointMiddleware;
using static Meadowlark.Net.Core.Middleware.ValidateDocumentMiddleware;
using static Meadowlark.Net.Core.Backend.Postgresql.Upsert;
using static Meadowlark.Net.Core.Backend.Postgresql.GetById;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Meadowlark.Net.Core;


public static class FrontendFacade
{
  /**
   * Entry point for API upsert actions
   */
  public static async Task<FrontendResponse> UpsertCore(FrontendRequest frontendRequest)
  {
    try
    {
      RequestModel requestModel = new(FrontendRequest: frontendRequest, PathComponents: No.PathComponents, ResourceInfo: No.ResourceInfo,
        ApiSchema: No.ApiSchema, ResourceSchema: No.ResourceSchema);
      MiddlewareModel middlewareModel = new(RequestModel: requestModel, FrontendResponse: null);

      var (finalRequestModel, frontendResponse) = middlewareModel
        .SendTo(LoadApiSchema)
        .AndThen(ParsePath)
        .AndThen(EndpointValidation)
        .AndThen(DocumentValidation);

      // if there is a response posted by the stack, we are done
      if (frontendResponse != null) return frontendResponse;

      DocumentUuid documentUuid = new(Guid.NewGuid().ToString());
      return await UpsertDb(new(documentUuid, finalRequestModel.ResourceInfo, frontendRequest.Body ?? new JObject()));
    }
    catch (Exception)
    {
      return new(StatusCode: 500, Body: "Fail");
    }
  }

  /**
   * Entry point for API get by id actions
   */
  public static async Task<FrontendResponse> GetByIdCore(FrontendRequest frontendRequest)
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

      // if there is a response posted by the stack, we are done
      if (frontendResponse != null) return frontendResponse;

      return await GetByIdDb(new(finalRequestModel.PathComponents.DocumentUuid ?? new(""), finalRequestModel.ResourceInfo));
    }
    catch (Exception)
    {
      return new(StatusCode: 500, Body: "Fail");
    }
  }
}
