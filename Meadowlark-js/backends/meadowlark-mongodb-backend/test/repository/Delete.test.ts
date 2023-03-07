import { DeleteRequest, newResourceInfo, newSecurity } from '@edfi/meadowlark-core';
import * as utilities from '@edfi/meadowlark-utilities';
import { deleteDocumentById } from '../../src/repository/Delete';
import * as DB from '../../src/repository/Db';

jest.setTimeout(40000);

describe('given a transaction on a resource', () => {
  const retryNumberOfTimes = 2;
  let mongoClienttMock = {};
  let deleteOneMock = jest.fn();

  beforeAll(() => {
    deleteOneMock = jest.fn().mockImplementation(async () => Promise.reject(new Error('[MongoServerError: WriteConflict]')));

    jest.spyOn(DB, 'getDocumentCollection').mockReturnValue({
      deleteOne: deleteOneMock,
    } as any);

    mongoClienttMock = {
      startSession: jest.fn().mockReturnValue({
        withTransaction: async (cb: any) => {
          await cb();
        },
        endSession: jest.fn(),
      }),
    };
  });

  describe('when it tries to delete the same resource and mongo db returns write conflict error', () => {
    const deleteRquest: DeleteRequest = {
      id: '1',
      validate: false,
      traceId: '1',
      resourceInfo: newResourceInfo(),
      security: newSecurity(),
    };
    let result;

    describe('given that a number of retries greater than zero has been configured', () => {
      beforeAll(async () => {
        jest.spyOn(utilities.Config, 'get').mockReturnValue(retryNumberOfTimes);
        result = await deleteDocumentById(deleteRquest, mongoClienttMock as any);
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
        result = await deleteDocumentById(deleteRquest, mongoClienttMock as any);
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
        result = await deleteDocumentById(deleteRquest, mongoClienttMock as any);
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
