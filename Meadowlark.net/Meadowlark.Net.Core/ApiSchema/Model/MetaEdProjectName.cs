namespace Meadowlark.Net.Core.ApiSchema.Model;

/**
 * A string type branded as a MetaEdProjectName, which is the MetaEd project name for a collection of
 * API resources, e.g. "EdFi" for an Ed-Fi data standard version.
 */
public record struct MetaEdProjectName(string Value);
