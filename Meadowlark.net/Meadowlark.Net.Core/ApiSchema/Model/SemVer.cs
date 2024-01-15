namespace Meadowlark.Net.Core.ApiSchema.Model;

/**
 * A string type branded as a SemVer, which is a semantic version string.
 * See https://semver.org/spec/v2.0.0.html
 */
public record struct SemVer(string Value);
