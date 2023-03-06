import { UpsertRequest, newResourceInfo, newSecurity, newDocumentInfo } from '@edfi/meadowlark-core';
import * as utilities from '@edfi/meadowlark-utilities';
import { upsertDocument } from '../../src/repository/Upsert';
import * as DB from '../../src/repository/Db';

let mongoClienttMock = {};

jest.setTimeout(40000);

describe('given a transaction on a resource', () => {
  beforeAll(() => {
    jest.spyOn(utilities.Config, 'get').mockReturnValue(2);

    jest.spyOn(DB, 'getDocumentCollection').mockReturnValue({
      replaceOne: jest.fn().mockImplementation(async () => Promise.reject(new Error('[MongoServerError: WriteConflict]'))),
      findOne: jest.fn().mockReturnValue(null),
    } as any);

    jest.spyOn(DB, 'writeLockReferencedDocuments').mockImplementationOnce(async () => Promise.resolve());

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

  describe('when it tries to upsert the same resource', () => {
    it('returns error', async () => {
      const upsertRquest: UpsertRequest = {
        id: '1',
        validate: false,
        traceId: '1',
        resourceInfo: newResourceInfo(),
        security: newSecurity(),
        documentInfo: newDocumentInfo(),
        edfiDoc: {},
      };
      const result = await upsertDocument(upsertRquest, mongoClienttMock as any);
      expect(result.response).toBe('UPSERT_FAILURE_WRITE_CONFLICT');
      expect(result.failureMessage).toBe('Write conflict error returned');
    });
  });
});
