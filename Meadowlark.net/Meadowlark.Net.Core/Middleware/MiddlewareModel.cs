using Meadowlark.Net.Core.Model;

namespace Meadowlark.Net.Core;

/**
 * Processing ends once there is a response.
 */
public record MiddlewareModel(RequestModel RequestModel, FrontendResponse? FrontendResponse);
