namespace Meadowlark.Net.Core.ApiSchema.Model;

/**
 *  A string type branded as a MetaEdPropertyPath, which is a dot-separated MetaEd property name list
 *  denoting a path from a starting entity through other entities. Role names on a property
 *  are expressed by prefix on the property name. Most commonly used as a merge directive path.
 */
public record struct MetaEdPropertyPath(string Value);
