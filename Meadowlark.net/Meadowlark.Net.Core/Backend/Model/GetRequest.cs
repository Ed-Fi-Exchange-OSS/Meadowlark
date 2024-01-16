using Meadowlark.Net.Core.Model;
namespace Meadowlark.Net.Core.Backend.Model;

public record GetRequest(DocumentUuid DocumentUuid, ResourceInfo ResourceInfo);
