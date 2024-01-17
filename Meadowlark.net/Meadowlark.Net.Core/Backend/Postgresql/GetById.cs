using Meadowlark.Net.Core.Backend.Model;
using static Meadowlark.Net.Core.Backend.Postgresql.Db;

namespace Meadowlark.Net.Core.Backend.Postgresql;

public static class GetById
{
  public static async Task<FrontendResponse> GetByIdDb(GetRequest getRequest)
  {
    GetResponse result = await FindDocumentByDocumentUuid(getRequest);
    return new(StatusCode: 200, Body: $"Success: {result.EdfiDoc}");
  }
}
