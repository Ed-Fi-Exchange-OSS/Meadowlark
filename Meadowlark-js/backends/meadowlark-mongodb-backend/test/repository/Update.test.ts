import {
  UpdateRequest,
  newSecurity,
  DocumentUuid,
  NoResourceInfo,
  NoDocumentInfo,
  MeadowlarkId,
  TraceId,
} from '@edfi/meadowlark-core';
import * as utilities from '@edfi/meadowlark-utilities';
import { updateDocumentByDocumentUuid } from '../../src/repository/Update';
import * as DB from '../../src/repository/Db';

describe('given a transaction on a resource', () => {
  const retryNumberOfTimes = 2;
  let mongoClientMock = {};
  let updateOneMock = jest.fn();
  const error = {
    code: 112,
    codeName: 'WriteConflict',
  };

  beforeAll(() => {
    updateOneMock = jest.fn().mockImplementation(async () => Promise.reject(error));

    jest.spyOn(DB, 'getDocumentCollection').mockReturnValue({
      updateMany: jest.fn(),
      findOne: jest.fn(),
      updateOne: updateOneMock,
      find: jest.fn(() => ({ toArray: (_) => [{ some: 'content' }] })),
    } as any);

    jest.spyOn(DB, 'getConcurrencyCollection').mockReturnValue({
      insertMany: jest.fn(),
      deleteMany: jest.fn(),
    } as any);

    mongoClientMock = {
      startSession: jest.fn().mockReturnValue({
        withTransaction: async (cb: any) => {
          await cb();
        },
        endSession: jest.fn(),
        abortTransaction: jest.fn(),
      }),
    };
  });

  describe('when it tries to update the same resource and mongo db returns write conflict error', () => {
    const newUpdateRequest = (): UpdateRequest => ({
      meadowlarkId: '' as MeadowlarkId,
      documentUuid: '' as DocumentUuid,
      resourceInfo: NoResourceInfo,
      documentInfo: NoDocumentInfo,
      edfiDoc: {},
      validateDocumentReferencesExist: false,
      security: { ...newSecurity() },
      traceId: 'traceId' as TraceId,
    });
    let result;

    describe('given that a number of retries greater than zero has been configured', () => {
      beforeAll(async () => {
        jest.spyOn(utilities.Config, 'get').mockReturnValue(retryNumberOfTimes);
        result = await updateDocumentByDocumentUuid(newUpdateRequest(), mongoClientMock as any);
      });

      it('returns error', async () => {
        expect(result.response).toBe('UPDATE_FAILURE_WRITE_CONFLICT');
      });

      it('should retry a number of times based on configuration', () => {
        expect(updateOneMock).toHaveBeenCalledTimes(retryNumberOfTimes + 1);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });
    });

    describe('given that a number of retries equal to zero has been configured', () => {
      beforeAll(async () => {
        jest.spyOn(utilities.Config, 'get').mockReturnValue(0);
        result = await updateDocumentByDocumentUuid(newUpdateRequest(), mongoClientMock as any);
      });

      it('should not retry', () => {
        expect(updateOneMock).toHaveBeenCalledTimes(1);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });
    });

    describe('given that a number of retries was not configured', () => {
      beforeAll(async () => {
        result = await updateDocumentByDocumentUuid(newUpdateRequest(), mongoClientMock as any);
      });

      it('should not retry', () => {
        expect(updateOneMock).toHaveBeenCalledTimes(1);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });
    });
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});
