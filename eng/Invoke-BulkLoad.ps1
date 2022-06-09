# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.

#Requires -Version 7
$ErrorActionPreference = "Stop"

Import-Module ./Package-Management.psm1 -force

$apiUrl = "http://localhost:3000/local"
$key = "meadowlark_key_1"
$secret = "meadowlark_secret_1"
$sampleDataVersion = "3.3.1-b"
$bulkLoadVersion = "5.3"
$xsdDirectory = "$($PSScriptRoot)/.packages/XSD"

$sampleDataDir = (Get-SampleData $sampleDataVersion).Trim()

# Full path to the BulkLoadClient exe
$bulkLoader = (Join-Path -Path (Get-BulkLoadClient $bulkLoadVersion).Trim() -ChildPath "tools/netcoreapp3.1/any/EdFi.BulkLoadClient.Console.dll")
Write-Host "Bulk Loader: $bulkLoader"

# Create a working/temp directory
$working = (New-Item -Path "$($PsScriptRoot)/.working" -Type Directory -Force)

# Get XSD files from the Ed-Fi production demo site, because Meadowlark does not serve them
Get-EdFiXsd -XsdDirectory $xsdDirectory

# Load Descriptors
$options = @(
    "-b", $apiUrl,
    "-d", "$($sampleDataDir)/Bootstrap",
    "-w", $working,
    "-k", $key,
    "-s", $secret,
	"-r", "1",
    "-l", "1",
    "-f",
    "-n",
    "-x", $xsdDirectory
)

Write-host -ForegroundColor Cyan $apiLoaderExe $options
&dotnet $bulkLoader $options
