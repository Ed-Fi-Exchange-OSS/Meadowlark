namespace Meadowlark.Net.Core.ApiSchema.Model;

/**
 * A string type branded as a MetaEdResourceName, which is the name of an API resource. Typically, this is the same
 * as the corresponding MetaEd entity name. However, there are exceptions, for example descriptors have a
 * "Descriptor" suffix on their resource name.
 */
public record struct MetaEdResourceName(string Value);
