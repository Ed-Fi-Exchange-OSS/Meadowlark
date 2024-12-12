# Meadowlark - Loading Descriptors

As of Meadowlark releases 0.2.0 and 0.3.0, there are two mechanisms for quickly loading the default descriptor sets into a running API:

1. Make an HTTP call to `http://localhost:3000/local/loadDescriptors` ; this will load all descriptors through an internal operation, without any additional HTTP calls.
2. Open one of the "Invoke-Load?.ps1" PowerShell scripts in the `eng`  directory; comment out the last line of the script so that only descriptors run. This uses the ODS/API's dotnet-based client side bulk loader utility to open the descriptor XML files and load the resources one-by-one through the API. This is essentially how the ODS/API's minimal template is populated.

Option 1 is not in the long-term plans. It was a short-term solution that saw us bundle all of the Data Standard 3.3.1-a descriptor XML files directly into the repository, as part of the `meadowlark-core`  library. That is not a scalable solution. Option 2 became available when a member of the Ed-Fi tech team manually created a NuGet package of those same XML files and published it in the Alliance's NuGet repository on MyGet. The long-term plan is to automate the process of bundling the descriptor XML and the rest of the Grand Bend sample XML files into NuGet packages.
