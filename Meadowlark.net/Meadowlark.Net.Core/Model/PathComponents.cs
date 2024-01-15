using Meadowlark.Net.Core.ApiSchema.Model;

namespace Meadowlark.Net.Core.Model;

/**
 * The important parts of the request URL in object form
 */
public record PathComponents(
  /**
   * Project namespace, all lowercased
   */
  ProjectNamespace ProjectNamespace,

  /**
   * Endpoint name, which has been decapitalized
   */
  EndpointName EndpointName,

  /**
   * The resource identifier, which is a document uuid
   */
  DocumentUuid? DocumentUuid
);
