import { DeleteRequest, newSecurity, TraceId, NoResourceInfo, DocumentUuid } from '@edfi/meadowlark-core';
import * as utilities from '@edfi/meadowlark-utilities';
import { deleteDocumentByDocumentUuid } from '../../src/repository/Delete';
import * as DB from '../../src/repository/Db';

describe('given a transaction on a resource', () => {
  const retryNumberOfTimes = 2;
  let mongoClientMock = {};
  let deleteOneMock = jest.fn();
  const error = {
    codeName: 'WriteConflict',
  };

  beforeAll(() => {
    deleteOneMock = jest.fn().mockImplementation(async () => Promise.reject(error));

    jest.spyOn(DB, 'getDocumentCollection').mockReturnValue({
      deleteOne: deleteOneMock,
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

  describe('when it tries to delete the same resource and mongo db returns write conflict error', () => {
    const newDeleteRequest = (): DeleteRequest => ({
      documentUuid: '' as DocumentUuid,
      resourceInfo: NoResourceInfo,
      validateNoReferencesToDocument: false,
      security: { ...newSecurity() },
      traceId: 'traceId' as TraceId,
    });
    let result;

    describe('given that a number of retries greater than zero has been configured', () => {
      beforeAll(async () => {
        jest.spyOn(utilities.Config, 'get').mockReturnValue(retryNumberOfTimes);
        result = await deleteDocumentByDocumentUuid(newDeleteRequest(), mongoClientMock as any);
      });

      it('returns error', async () => {
        expect(result.response).toBe('DELETE_FAILURE_WRITE_CONFLICT');
      });

      it('should retry a number of times based on configuration', () => {
        expect(deleteOneMock).toHaveBeenCalledTimes(retryNumberOfTimes + 1);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });
    });

    describe('given that a number of retries equal to zero has been configured', () => {
      beforeAll(async () => {
        jest.spyOn(utilities.Config, 'get').mockReturnValue(0);
        result = await deleteDocumentByDocumentUuid(newDeleteRequest(), mongoClientMock as any);
      });

      it('should not retry', () => {
        expect(deleteOneMock).toHaveBeenCalledTimes(1);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });
    });

    describe('given that a number of retries was not configured', () => {
      beforeAll(async () => {
        result = await deleteDocumentByDocumentUuid(newDeleteRequest(), mongoClientMock as any);
      });

      it('should not retry', () => {
        expect(deleteOneMock).toHaveBeenCalledTimes(1);
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
