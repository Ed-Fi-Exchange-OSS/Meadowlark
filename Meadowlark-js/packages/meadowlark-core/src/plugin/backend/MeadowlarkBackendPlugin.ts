// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { DocumentInfo } from '../../model/DocumentInfo';
import { ForeignKeyItem } from '../../model/ForeignKeyItem';
import { Security } from '../../model/Security';
import { ValidationOptions } from '../../model/ValidationOptions';
import { GetResult } from './GetResult';
import { OwnershipResult } from './OwnershipResult';
import { PutResult } from './PutResult';
import { DeleteResult } from './DeleteResult';
import { PaginationParameters } from './PaginationParameters';
import { SearchResult } from './SearchResult';

export interface MeadowlarkBackendPlugin {
  createEntity: (
    id: string,
    documentInfo: DocumentInfo,
    info: object,
    validationOptions: ValidationOptions,
    security: Security,
    lambdaRequestId: string,
  ) => Promise<PutResult>;

  getEntityById: (
    _documentInfo: DocumentInfo,
    id: string,
    _security: Security,
    _lambdaRequestId: string,
  ) => Promise<GetResult>;

  getEntityList: (_documentInfo: DocumentInfo, _lambdaRequestId: string) => Promise<GetResult>;

  updateEntityById: (
    _id: string,
    _documentInfo: DocumentInfo,
    _info: object,
    _validationOptions: ValidationOptions,
    _security: Security,
    _lambdaRequestId: string,
  ) => Promise<PutResult>;

  deleteEntityById: (_id: string, _documentInfo: DocumentInfo, _lambdaRequestId: string) => Promise<DeleteResult>;

  getReferencesToThisItem: (
    _id: string,
    _documentInfo: DocumentInfo,
    _lambdaRequestId: string,
  ) => Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }>;

  getForeignKeyReferences: (
    _id: string,
    _documentInfo: DocumentInfo,
    _lambdaRequestId: string,
  ) => Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }>;

  deleteItems: (_items: { pk: string; sk: string }[], _awsRequestId: string) => Promise<DeleteResult>;

  validateEntityOwnership: (
    _id: string,
    _documentInfo: DocumentInfo,
    _clientName: string | null,
    _lambdaRequestId: string,
  ) => Promise<OwnershipResult>;

  queryEntityList: (
    documentInfo: DocumentInfo,
    queryStringParameters: object,
    paginationParameters: PaginationParameters,
    awsRequestId: string,
  ) => Promise<SearchResult>;
}
