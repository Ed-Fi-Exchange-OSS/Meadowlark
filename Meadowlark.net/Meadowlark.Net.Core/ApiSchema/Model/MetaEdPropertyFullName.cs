namespace Meadowlark.Net.Core.ApiSchema.Model;

/**
 * A string type branded as a MetaEdPropertyFullName, which is the full property name of a MetaEd
 * property on a MetaEd entity. Role names on a property are expressed by prefix on the property name.
 */
public record struct MetaEdPropertyFullName(string Value);
