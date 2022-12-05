# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

#Requires -Version 7
$ErrorActionPreference = "Stop"

Import-Module ./Package-Management.psm1 -force
Import-Module ./Get-XSD.psm1 -force

$baseUrl = "http://localhost:3000/local"
$adminKey = "meadowlark_admin_key_1"
$adminSecret = "meadowlark_admin_secret_1"
$sampleDataVersion = "3.3.1-b"
$bulkLoadVersion = "6.1"
$xsdDirectory = (Resolve-Path "$($PSScriptRoot)/.packages/XSD")

$sampleDataDir = (Get-SampleData $sampleDataVersion).Trim()

#
# Create a regular user using the admin key and secret
#

# Authenticate as admin
$tokenUrl = "$($baseUrl)/oauth/token"
$body = @{
  "grant_type"    = "client_credentials"
  "client_id"     = $adminKey
  "client_secret" = $adminSecret
} | ConvertTo-Json
$headers = @{
  "content-type" = "application/json"
}

$response = Invoke-RestMethod -Method POST -Body $body -Headers $headers -Uri $tokenUrl
$accessToken = $response.access_token

# Create regular account
$body = @{
  clientName = "Bulk Loader"
  roles      = @(
    "vendor"
  )
} | ConvertTo-Json

$headers.Add("Authorization", "bearer $accessToken")

$clientUrl = "$($baseUrl)/oauth/clients"
$response = Invoke-RestMethod -Method POST -Body $body -Headers $headers -Uri $clientUrl
$key = $response.client_id
$secret = $response.client_secret

Write-Output $key
Write-Output $secret

#
# Prepare for bulk load
#

# Full path to the BulkLoadClient exe
$bulkLoader = (Join-Path -Path (Get-BulkLoadClient $bulkLoadVersion).Trim() -ChildPath "tools/net*/any/EdFi.BulkLoadClient.Console.dll")
$bulkLoader = Resolve-Path $bulkLoader
Write-Host "Bulk Loader: $bulkLoader"

# # Create a working/temp directory
$working = (New-Item -Path "$($PsScriptRoot)/.working" -Type Directory -Force)

# # Get XSD files from the Ed-Fi production demo site, because Meadowlark does not serve them
Get-EdFiXsd -XsdDirectory $xsdDirectory

#
# Run bulk load
#

# Load descriptors
$options = @(
  "-b", $baseUrl,
  "-d", (Resolve-Path "$($sampleDataDir)/Bootstrap"),
  "-w", $working,
  "-k", $key,
  "-s", $secret,
  "-c", "100",
  "-r", "0",
  "-l", "500",
  "-t", "50",
  "-f",
  "-n",
  "-x", $xsdDirectory
)

Write-host -ForegroundColor Cyan $apiLoaderExe $options
&dotnet $bulkLoader $options

# Load Grand Bend
$options = @(
  "-b", $baseUrl,
  "-d", (Resolve-Path "$($sampleDataDir)/Sample XML"),
  "-w", $working,
  "-k", $key,
  "-s", $secret,
  "-c", "100",
  "-r", "0",
  "-l", "500",
  "-t", "50",
  "-f",
  "-n",
  "-x", $xsdDirectory
)

# Write-host -ForegroundColor Cyan $apiLoaderExe $options
&dotnet $bulkLoader $options
