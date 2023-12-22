using Newtonsoft.Json.Linq;
namespace Meadowlark.Net.Core.Model;

/**
 * Processing ends once there is a response.
 */
public record RequestModel(
  /**
   * The FrontendRequest from the frontend
   */
  FrontendRequest FrontendRequest,

  /**
   * The important parts of the request URL in object form
   */
  PathComponents PathComponents,

  /**
   * Base API resource information for passing along to backends
   */
  ResourceInfo ResourceInfo,

  /**
   * Full API schema information describing all resources and resource extensions
   */
  JObject ApiSchema,

  /**
   * Full API resource schema information describing the shape of this resource
   */
  JObject ResourceSchema

  /**
   * Complete information on a validated API document
   */
  // DocumentInfo DocumentInfo
);
