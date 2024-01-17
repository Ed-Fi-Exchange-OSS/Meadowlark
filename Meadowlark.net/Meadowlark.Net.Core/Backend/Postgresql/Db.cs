using Meadowlark.Net.Core.Backend.Model;
using Meadowlark.Net.Core.Model;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Npgsql;
using NpgsqlTypes;

namespace Meadowlark.Net.Core.Backend.Postgresql;

public static class Db
{
  // TODO: Get .env loading working
  private static readonly string connectionString = "Server=localhost;Port=5432;User Id=postgres;Password=abcdefgh1!;Database=MeadowlarkNet;";

  // static Db()
  // {
  // Load .env file with Postgresql username/password
  // DotNetEnv.Env.TraversePath().Load();
  // connectionString: $"Server=localhost;Port=5432;User Id={Environment.GetEnvironmentVariable("POSTGRES_USER")};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")};Database=MeadowlarkNet;");
  // }

  private static async Task TryCreateTable(ResourceInfo resourceInfo)
  {
    // Note: ProjectName and ResourceName have been validated against the ApiSchema, so SQL injection is not a concern here
    string schemaName = resourceInfo.ProjectName.Value.Replace("-", "");
    string tableName = resourceInfo.ResourceName.Value.Replace("-", "");

    using var con = new NpgsqlConnection(connectionString);
    con.Open();
    using var cmd = new NpgsqlCommand();
    cmd.Connection = con;

    cmd.CommandText = $"CREATE SCHEMA IF NOT EXISTS {schemaName}";
    await cmd.ExecuteNonQueryAsync();
    cmd.CommandText = $@"CREATE TABLE IF NOT EXISTS {schemaName}.{tableName}(
  id bigserial PRIMARY KEY,
  document_uuid UUID NOT NULL,
  project_name VARCHAR NOT NULL,
  resource_name VARCHAR NOT NULL,
  resource_version VARCHAR NOT NULL,
  is_descriptor BOOLEAN NOT NULL,
  edfi_doc JSONB NOT NULL);";
    await cmd.ExecuteNonQueryAsync();
  }

  public static async Task InsertDocument(InsertRequest insertRequest)
  {
    await TryCreateTable(insertRequest.ResourceInfo);

    // Note: ProjectName and ResourceName have been validated against the ApiSchema, so SQL injection is not a concern here
    string schemaName = insertRequest.ResourceInfo.ProjectName.Value.Replace("-", "");
    string tableName = insertRequest.ResourceInfo.ResourceName.Value.Replace("-", "");
    var (documentUuid, resourceInfo, edfiDoc) = insertRequest;

    // Add the new documentUuid to the document
    edfiDoc.Add(new JProperty("id", documentUuid.Value));

    using var con = new NpgsqlConnection(connectionString);
    con.Open();

    var commandText = $@" INSERT INTO {schemaName}.{tableName}
      (document_uuid, project_name, resource_name, resource_version, is_descriptor, edfi_doc)
      VALUES ($1, $2, $3, $4, $5, $6)";
    await using var cmd = new NpgsqlCommand(commandText, con)
    {
      Parameters = {
        new() {Value = new Guid(documentUuid.Value), NpgsqlDbType = NpgsqlDbType.Uuid },
        new() {Value = resourceInfo.ProjectName.Value },
        new() {Value = resourceInfo.ResourceName.Value },
        new() {Value = resourceInfo.ResourceVersion.Value },
        new() {Value = resourceInfo.IsDescriptor },
        new() {Value = JsonConvert.SerializeObject(edfiDoc), NpgsqlDbType = NpgsqlDbType.Jsonb }
      }
    };
    await cmd.ExecuteNonQueryAsync();
  }

  public static async Task<GetResponse> FindDocumentByDocumentUuid(GetRequest getRequest)
  {
    await TryCreateTable(getRequest.ResourceInfo);

    // Note: ProjectName and ResourceName have been validated against the ApiSchema, so SQL injection is not a concern here
    string schemaName = getRequest.ResourceInfo.ProjectName.Value.Replace("-", "");
    string tableName = getRequest.ResourceInfo.ResourceName.Value.Replace("-", "");

    using var con = new NpgsqlConnection(connectionString);
    con.Open();

    var commandText = $@"SELECT edfi_doc FROM {schemaName}.{tableName} WHERE document_uuid = $1;";

    await using var cmd = new NpgsqlCommand(commandText, con)
    {
      Parameters = {
        new() { Value = new Guid(getRequest.DocumentUuid.Value), NpgsqlDbType = NpgsqlDbType.Uuid }
      }
    };

    var result = await cmd.ExecuteScalarAsync();
    return new(result == null ? "" : result.ToString() ?? "");
  }
}
