using Newtonsoft.Json.Linq;

namespace Meadowlark.Net.Core.Model;

public static class No
{
  /**
   * The null object for PathComponents --- not quite right as records do value equality
   * and we want identity equality -- switch to struct/class?
   */
  public readonly static PathComponents PathComponents = new(ProjectNamespace: new(""), EndpointName: new(""), DocumentUuid: null);

  /**
   * The null object for ResourceInfo --- not quite right as records do value equality
   * and we want identity equality -- switch to struct/class?
   */
  public readonly static ResourceInfo ResourceInfo = new(ProjectName: new(""), ResourceName: new(""), IsDescriptor: false,
    ResourceVersion: new(""), AllowIdentityUpdates: false);

   /**
   * The null object for ApiSchema
   */
  public readonly static JObject ApiSchema = [];

  /**
   * The null object for ProjectSchema
   */
  public readonly static JObject ProjectSchema = [];

  /**
   * The null object for ResourceSchema
   */
  public readonly static JObject ResourceSchema = [];
}
