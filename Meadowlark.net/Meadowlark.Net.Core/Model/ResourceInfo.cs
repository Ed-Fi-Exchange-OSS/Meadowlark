using Meadowlark.Net.Core.ApiSchema.Model;
namespace Meadowlark.Net.Core.Model;

/**
 * Base API resource information for passing along to backends
 */
public record BaseResourceInfo(
  /**
   * The project name the API document resource is defined in e.g. "EdFi" for a data standard entity.
   */
  MetaEdProjectName ProjectName,

  /**
   * The name of the resource. Typically, this is the same as the corresponding MetaEd entity name. However,
   * there are exceptions, for example descriptors have a "Descriptor" suffix on their resource name.
   */
  MetaEdResourceName ResourceName,

   /**
    * Whether this resource is a descriptor. Descriptors are treated differently from other documents
    */
   bool IsDescriptor
);

/**
 * API resource information including version
 */
public record ResourceInfo(
  MetaEdProjectName ProjectName,
  MetaEdResourceName ResourceName,
  bool IsDescriptor,

  /**
   * The project version the resource belongs to.
   */
  SemVer ResourceVersion,

  /**
   * Whether the resource allows the identity fields of a document to be updated (changed)
   */
  bool AllowIdentityUpdates
) : BaseResourceInfo(ProjectName, ResourceName, IsDescriptor);

