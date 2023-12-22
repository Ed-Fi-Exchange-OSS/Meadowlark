using Meadowlark.Net.Core.Backend.Model;
using static Meadowlark.Net.Core.Backend.Postgresql.Db;

namespace Meadowlark.Net.Core.Backend.Postgresql;

public static class Upsert
{
  public static async Task<FrontendResponse> UpsertDb(InsertRequest insertRequest)
  {
    await InsertDocument(insertRequest);
    return new(StatusCode: 200, Body: $"Success: {insertRequest.ToString()}");
  }
}
