using Meadowlark.Net.Core.Model;
using Newtonsoft.Json.Linq;
namespace Meadowlark.Net.Core.Backend.Model;

public record InsertRequest(DocumentUuid DocumentUuid, ResourceInfo ResourceInfo, JObject EdfiDoc);
