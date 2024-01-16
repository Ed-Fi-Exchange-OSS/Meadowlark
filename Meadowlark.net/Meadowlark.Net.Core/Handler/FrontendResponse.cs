namespace Meadowlark.Net.Core;
/**
 * An API response sent from core to the frontend
 */
public record FrontendResponse(int StatusCode, string Body);
