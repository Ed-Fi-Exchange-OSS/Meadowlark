# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

param(
  [Parameter(Mandatory=$true)]
  [string]
  $Username,

  [Parameter(Mandatory=$true)]
  [string]
  $PersonalAccessToken,

  [Parameter(Mandatory=$true)]
  [string]
  $Version
)

$urlTemplate = "https://pkgs.dev.azure.com/ed-fi-alliance/Ed-Fi-Alliance-OSS/_apis/packaging/feeds/EdFi/npm/@edfi/{PACKAGE}/versions/{VERSION}?api-version=7.1-preview.1"

Push-Location ../Meadowlark-js
$packages = $(npm ls --workspaces --parseable --package-lock-only) -Split [Environment]::NewLine |
                    ForEach-Object { $_.replace("\", "/") } | # Standardize for all OS's
                    Where-Object { $_.contains("@edfi/meadowlark") -and -not $_.contains("e2e") } |
                    Select-Object { $_ -split "/" | Select-Object -last 1 }
Pop-Location

$basicToken = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$($Username):$($PersonalAccessToken)"))
$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "basic $basicToken"
}

$body = "{
  `"views`": {
    `"op`": `"add`",
    `"path`": `"/views/-`",
    `"value`": `"Release`"
  }
}"

$messages = @()
$packages | ForEach-Object {
  $url = $urlTemplate.Replace("{PACKAGE}", "$($_.' $_ -split "/" | Select-Object -last 1 ')").Replace("{VERSION}", "$Version")

  $response = Invoke-RestMethod $url -Method 'PATCH' -Headers $headers -Body $body
  
  $messages += @{
    "url" = $url
    "response" = $response
  }
}

$messages | ConvertTo-Json