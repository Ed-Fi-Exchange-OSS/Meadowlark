using Meadowlark.Net.Core.Model;
using static Meadowlark.Net.Core.Validation.DocumentValidator;

namespace Meadowlark.Net.Core.Middleware;

public static class ValidateDocumentMiddleware
{
  /**
   * Validates JSON document shape
   */
  public static MiddlewareModel DocumentValidation(MiddlewareModel middlewareModel)
  {
    var (requestModel, frontendResponse) = middlewareModel;

    // if there is a response already posted, we are done
    if (frontendResponse != null) return middlewareModel;

    // if the body is null, this middleware shouldn't be involved
    if (requestModel.FrontendRequest.Body == null) throw new Exception("requestModel.FrontendRequest.Body is null");

    string[] errors = ValidateDocument(requestModel.ResourceSchema, requestModel.FrontendRequest.Body);

    if (errors.Length > 0)
    {
      return middlewareModel with { FrontendResponse = new(StatusCode: 400, Body: String.Join(", ", errors)) };
    }

    return middlewareModel;
  }
}
