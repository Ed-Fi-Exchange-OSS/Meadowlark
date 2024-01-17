// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Meadowlark.Net.Core;
using static Meadowlark.Net.Core.FrontendFacade;

namespace Meadowlark.Net.Frontend.MinimalAPI
{
  public static class CrudHandler
  {
    private static async Task<JObject?> ExtractJsonBodyFrom(HttpRequest request)
    {
      using Stream body = request.Body;
      using StreamReader bodyReader = new(body);
      var requestBody = await bodyReader.ReadToEndAsync();

      if (String.IsNullOrEmpty(requestBody)) return null;

      return JsonConvert.DeserializeObject<JObject>(requestBody);
    }

    /**
     * Entry point for API POST requests
     */
    public static async Task<IResult> Upsert(HttpRequest request)
    {
      JObject? body = await ExtractJsonBodyFrom(request);

      FrontendRequest frontendRequest = new(Action: "POST", Body: body, Path: request.Path, TraceId: Guid.NewGuid().ToString());

      var frontendResponse = await UpsertCore(frontendRequest);

      return Results.Content(statusCode: frontendResponse.StatusCode, content: frontendResponse.Body);
    }

    /**
     * Entry point for all API GET requests
     */
    public static async Task<IResult> GetById(HttpRequest request)
    {
      FrontendRequest frontendRequest = new(Action: "GET", Body: null, Path: request.Path, TraceId: Guid.NewGuid().ToString());

      var frontendResponse = await GetByIdCore(frontendRequest);

      return Results.Content(statusCode: frontendResponse.StatusCode, content: frontendResponse.Body);
    }

    /**
     * Entry point for all API PUT requests, which are "by id"
     */
    public static async Task<IResult> Update(HttpRequest request)
    {
      // respondWith(await meadowlarkUpdate(fromRequest(request)), reply);

      var q = await ExtractJsonBodyFrom(request);

      return Results.Ok(new { Message = "Update" });
    }

    /**
     * Entry point for all API DELETE requests, which are "by id"
     */
    public static IResult DeleteIt(HttpRequest request)
    {
      // respondWith(await meadowlarkDelete(fromRequest(request)), reply);

      return Results.Ok(new { Message = "DeleteIt" });
    }

  }
}
