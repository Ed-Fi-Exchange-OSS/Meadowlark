using Newtonsoft.Json.Linq;

namespace Meadowlark.Net.Core.ApiSchema;

public static class ApiSchemaLoader
{
  public static JObject LoadApiSchemaFromFile()
  {
    // Hardcoded and synchronous way to read the API Schema file
    return JObject.Parse(File.ReadAllText($"{AppContext.BaseDirectory}/DataStandard-5.0.0-pre.1.json"));
  }
}
