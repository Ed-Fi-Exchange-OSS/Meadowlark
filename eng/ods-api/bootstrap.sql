-- SPDX-License-Identifier: Apache-2.0
-- Licensed to the Ed-Fi Alliance under one or more agreements.
-- The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
-- See the LICENSE and NOTICES files in the project root for more information.

insert into dbo.Vendors (
  VendorName
)
values (
  'Bootstrap Vendor'
);

insert into dbo.VendorNamespacePrefixes (
    NamespacePrefix,
    Vendor_VendorId
)
select
    'uri://ed-fi.org',
    VendorId
from
    dbo.Vendors;


insert into dbo.Applications (
  ApplicationName,
  OperationalContextUri,
  Vendor_VendorId,
  ClaimSetName
)
select
  'Bootstrap Application',
  'uri://ed-fi-api-host.org',
  VendorId,
  'Ed-Fi Sandbox'
from
    dbo.Vendors
where
  VendorName = 'Bootstrap Vendor';

insert into dbo.ApplicationEducationOrganizations (
    EducationOrganizationId,
    Application_ApplicationId
)
select
    255901,
    ApplicationId
from
    dbo.Applications
where
    ApplicationName = 'Bootstrap Application';

insert into dbo.ApiClients (
  Key,
  Secret,
  Name,
  IsApproved,
  UseSandbox,
  SandboxType,
  SecretIsHashed,
  Application_ApplicationId
)
select
  'sampleKey',
  'sampleSecret',
  'Bootstrap',
  true,
  true,
  0,
  false,
  ApplicationId
from
    dbo.Applications;

insert into dbo.ApiClientApplicationEducationOrganizations (ApiClient_ApiClientId, ApplicationEdOrg_ApplicationEdOrgId )
select ApiClients.ApiClientId, ApplicationEducationOrganizations.ApplicationEducationOrganizationId
from dbo.ApiClients
cross join dbo.Applications
inner join dbo.ApplicationEducationOrganizations on Applications.ApplicationId = ApplicationEducationOrganizations.Application_ApplicationId
where ApiClients.Name = 'Bootstrap' and Applications.ApplicationName = 'Bootstrap Application'
and not exists (select 1 from dbo.ApiClientApplicationEducationOrganizations
    where ApiClient_ApiClientId = ApiClients.ApiClientId
    and ApplicationEdOrg_ApplicationEdOrgId = ApplicationEducationOrganizations.ApplicationEducationOrganizationId);
