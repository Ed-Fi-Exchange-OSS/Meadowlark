# SPDX-License-Identifier: Apache-2.0
# Licensed to the Ed-Fi Alliance under one or more agreements.
# The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
# See the LICENSE and NOTICES files in the project root for more information.
<#
.DESCRIPTION
    Run performance tests multiple times
#>
param(
    [Parameter(Mandatory=$true)]
    [string]
    $PagingTestsPath,

    [int]
    $NumTrials = 5

)

$times = @()

$originalLocation = Get-Location
Set-Location -Path $PagingTestsPath

for ($i = 0; $i -lt $NumTrials; $i++) {
    $timing = Measure-Command { poetry run python edfi_paging_test }
    $times += $timing.TotalMilliseconds
}

$sum = 0.0
$times | ForEach-Object { $sum += $_ }
$mean= $sum / $NumTrials

$sumSquareError = 0.0
$times | ForEach-Object { $sumSquareError += [Math]::Pow($_ - $mean, 2) }
$standardDeviation = [Math]::Sqrt($sumSquareError / $NumTrials)

Write-Output @"
Mean: $mean
Standard Deviation: $standardDeviation
"@

Set-Location -Path $originalLocation
