using System.Text.RegularExpressions;
using Meadowlark.Net.Core.Model;

namespace Meadowlark.Net.Core.Middleware;

public static class ParsePathMiddleware
{
  private static string Decapitalize(string str)
  {
    if (str.Length == 0) return str;
    if (str.Length == 1) return str.ToLower();
    return str[0..1].ToLower() + str[1..];
  }

  private static PathComponents? PathComponentsFrom(string path)
  {
    // Matches all of the following sample expressions:
    // /ed-fi/Sections
    // /ed-fi/Sections/
    // /ed-fi/Sections/idValue
    Regex pathExpression = new(@"\/(?<projectNamespace>[^/]+)\/(?<endpointName>[^/]+)(\/|$)((?<documentUuid>[^/]*$))?");

    Match? match = pathExpression.Match(path);

    if (match == null)
    {
      return null;
    }

    string? documentUuidValue = match.Groups["documentUuid"].Value;
    if (documentUuidValue == "") documentUuidValue = null;

    return new(
      ProjectNamespace: new(match.Groups["projectNamespace"].Value.ToLower()),
      EndpointName: new(Decapitalize(match.Groups["endpointName"].Value)),
      DocumentUuid: documentUuidValue == null ? null : new(documentUuidValue)
    );
  }

  /**
   * Check that this is a well formed UUID v4
   */
  private static bool IsDocumentUuidWellFormed(DocumentUuid documentUuid)
  {
    // Regex for a UUID v4 string
    Regex uuid4Regex = new(@"^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$");

    return uuid4Regex.IsMatch(documentUuid.Value.ToLower());
  }

  /**
   * Handles path parsing
   */
  public static MiddlewareModel ParsePath(MiddlewareModel middlewareModel)
  {
    var (requestModel, frontendResponse) = middlewareModel;

    // if there is a response already posted, we are done
    if (frontendResponse != null) return middlewareModel;

    PathComponents? pathComponents = PathComponentsFrom(requestModel.FrontendRequest.Path);

    if (pathComponents == null)
    {
      return middlewareModel with { FrontendResponse = new(StatusCode: 404, Body: "") };
    }

    var updatedMiddlewareModel = middlewareModel with { RequestModel = requestModel with { PathComponents = pathComponents } };

    if (pathComponents.DocumentUuid != null && !IsDocumentUuidWellFormed(pathComponents.DocumentUuid.Value))
    {
      return updatedMiddlewareModel with { FrontendResponse = new(StatusCode: 404, Body: "") };
    }

    return updatedMiddlewareModel;
  }
}
