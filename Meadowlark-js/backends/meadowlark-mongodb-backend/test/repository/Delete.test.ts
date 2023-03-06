import { DeleteRequest, newResourceInfo, newSecurity } from '@edfi/meadowlark-core';
import * as utilities from '@edfi/meadowlark-utilities';
import { deleteDocumentById } from '../../src/repository/Delete';
import * as DB from '../../src/repository/Db';

let mongoClienttMock = {};

jest.setTimeout(40000);

describe('given a transaction on a resource', () => {
  beforeAll(() => {
    jest.spyOn(utilities.Config, 'get').mockReturnValue(2);

    jest.spyOn(DB, 'getDocumentCollection').mockReturnValue({
      deleteOne: jest.fn().mockImplementation(async () => Promise.reject(new Error('[MongoServerError: WriteConflict]'))),
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

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('when it tries to delete the same resource', () => {
    it('returns error', async () => {
      const deleteRquest: DeleteRequest = {
        id: '1',
        validate: false,
        traceId: '1',
        resourceInfo: newResourceInfo(),
        security: newSecurity(),
      };
      const result = await deleteDocumentById(deleteRquest, mongoClienttMock as any);
      expect(result.response).toBe('DELETE_FAILURE_WRITE_CONFLICT');
    });
  });
});
