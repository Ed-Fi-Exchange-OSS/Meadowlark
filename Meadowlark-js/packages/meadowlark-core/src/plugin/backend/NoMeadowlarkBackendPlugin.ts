// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { EntityInfo } from '../../model/EntityInfo';
import { ForeignKeyItem } from '../../model/ForeignKeyItem';
import { Security } from '../../model/Security';
import { ValidationOptions } from '../../model/ValidationOptions';
import { GetResult } from './GetResult';
import { OwnershipResult } from './OwnershipResult';
import { PutResult } from './PutResult';
import { DeleteResult } from './DeleteResult';
import { PaginationParameters } from './PaginationParameters';
import { SearchResult } from './SearchResult';
import { Logger } from '../../helpers/Logger';
import { MeadowlarkBackendPlugin } from './MeadowlarkBackendPlugin';

export const NoMeadowlarkBackendPlugin: MeadowlarkBackendPlugin = {
  createEntity: (
    _id: string,
    _entityInfo: EntityInfo,
    _info: object,
    _validationOptions: ValidationOptions,
    _security: Security,
    lambdaRequestId: string,
  ): Promise<PutResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.createEntity(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  getEntityById: (
    _entityInfo: EntityInfo,
    _id: string,
    _security: Security,
    lambdaRequestId: string,
  ): Promise<GetResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.getEntityById(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'ERROR', documents: [] });
  },

  getEntityList: (_entityInfo: EntityInfo, lambdaRequestId: string): Promise<GetResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.getEntityList(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'ERROR', documents: [] });
  },

  updateEntityById: (
    _id: string,
    _entityInfo: EntityInfo,
    _info: object,
    _validationOptions: ValidationOptions,
    _security: Security,
    lambdaRequestId: string,
  ): Promise<PutResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.updateEntityById(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ result: 'UNKNOWN_FAILURE' });
  },

  deleteEntityById: (_id: string, _entityInfo: EntityInfo, lambdaRequestId: string): Promise<DeleteResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.deleteEntityById(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ success: false });
  },

  getReferencesToThisItem: (
    _id: string,
    _entityInfo: EntityInfo,
    lambdaRequestId: string,
  ): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> => {
    Logger.warn(
      'NoMeadowlarkBackendPlugin.getReferencesToThisItem(): No backend plugin has been configured',
      lambdaRequestId,
    );
    return Promise.resolve({ success: false, foreignKeys: [] });
  },

  getForeignKeyReferences: (
    _id: string,
    _entityInfo: EntityInfo,
    lambdaRequestId: string,
  ): Promise<{ success: Boolean; foreignKeys: ForeignKeyItem[] }> => {
    Logger.warn(
      'NoMeadowlarkBackendPlugin.getForeignKeyReferences(): No backend plugin has been configured',
      lambdaRequestId,
    );
    return Promise.resolve({ success: false, foreignKeys: [] });
  },

  deleteItems: (_items: { pk: string; sk: string }[], lambdaRequestId: string): Promise<DeleteResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.deleteItems(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ success: false });
  },

  validateEntityOwnership: (
    _id: string,
    _entityInfo: EntityInfo,
    _clientName: string | null,
    lambdaRequestId: string,
  ): Promise<OwnershipResult> => {
    Logger.warn(
      'NoMeadowlarkBackendPlugin.validateEntityOwnership(): No backend plugin has been configured',
      lambdaRequestId,
    );
    return Promise.resolve({ result: 'ERROR', isOwner: false });
  },

  queryEntityList: (
    _entityInfo: EntityInfo,
    _queryStringParameters: object,
    _paginationParameters: PaginationParameters,
    lambdaRequestId: string,
  ): Promise<SearchResult> => {
    Logger.warn('NoMeadowlarkBackendPlugin.queryEntityList(): No backend plugin has been configured', lambdaRequestId);
    return Promise.resolve({ success: false, results: [] });
  },
};
