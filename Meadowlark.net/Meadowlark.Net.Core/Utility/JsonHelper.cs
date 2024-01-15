using Newtonsoft.Json.Linq;

namespace Meadowlark.Net.Core.Utility;

/**
 * Helpers to go from a JSONPath selection directly to a type
 */
public static class JsonHelperExtension {
  public static string PathAsString(this JToken jToken, string jsonPath) {
    JToken? targetToken = jToken.SelectToken(jsonPath);
    return targetToken == null ? "" : targetToken.ToObject<string>() ?? "";
  }

    public static bool PathAsBool(this JToken jToken, string jsonPath) {
    JToken? targetToken = jToken.SelectToken(jsonPath);
    return targetToken == null ? false : targetToken.ToObject<bool>();
  }
}
