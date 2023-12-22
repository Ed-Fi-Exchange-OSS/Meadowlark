namespace Meadowlark.Net.Core.ApiSchema.Model;

/**
 * A string type branded as a ProjectNamespace, which is the URI path component referring to a ProjectSchema
 * e.g. "ed-fi" for an Ed-Fi data standard version.
 */
public record struct ProjectNamespace(string Value);
