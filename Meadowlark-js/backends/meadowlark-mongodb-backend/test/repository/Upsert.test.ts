import { UpsertRequest, newResourceInfo, newSecurity, newDocumentInfo } from '@edfi/meadowlark-core';
import * as utilities from '@edfi/meadowlark-utilities';
import { upsertDocument } from '../../src/repository/Upsert';
import * as DB from '../../src/repository/Db';

jest.setTimeout(40000);

describe('given a transaction on a resource', () => {
  const retryNumberOfTimes = 2;
  let mongoClienttMock = {};
  let replaceOneMock = jest.fn();

  beforeAll(() => {
    replaceOneMock = jest
      .fn()
      .mockImplementation(async () => Promise.reject(new Error('[MongoServerError: WriteConflict]')));

    jest.spyOn(DB, 'getDocumentCollection').mockReturnValue({
      replaceOne: replaceOneMock,
      findOne: jest.fn().mockReturnValue(null),
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

  describe('when it tries to upsert the same resource and mongo db returns write conflict error', () => {
    const upsertRquest: UpsertRequest = {
      id: '1',
      validate: false,
      traceId: '1',
      resourceInfo: newResourceInfo(),
      security: newSecurity(),
      documentInfo: newDocumentInfo(),
      edfiDoc: {},
    };
    let result;

    describe('given that a number of retries greater than zero has been configured', () => {
      beforeAll(async () => {
        jest.spyOn(DB, 'writeLockReferencedDocuments').mockImplementationOnce(async () => Promise.resolve());
        jest.spyOn(utilities.Config, 'get').mockReturnValue(retryNumberOfTimes);
        result = await upsertDocument(upsertRquest, mongoClienttMock as any);
      });

      it('returns error', async () => {
        expect(result.response).toBe('UPSERT_FAILURE_WRITE_CONFLICT');
      });

      it('should retry a number of times based on configuration', () => {
        expect(replaceOneMock).toHaveBeenCalledTimes(retryNumberOfTimes + 1);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });
    });

    describe('given that a number of retries equal to zero has been configured', () => {
      beforeAll(async () => {
        jest.spyOn(DB, 'writeLockReferencedDocuments').mockImplementationOnce(async () => Promise.resolve());
        jest.spyOn(utilities.Config, 'get').mockReturnValue(0);
        result = await upsertDocument(upsertRquest, mongoClienttMock as any);
      });

      it('should not retry', () => {
        expect(replaceOneMock).toHaveBeenCalledTimes(1);
      });

      afterAll(() => {
        jest.clearAllMocks();
      });
    });

    describe('given that a number of retries was not configured', () => {
      beforeAll(async () => {
        jest.spyOn(DB, 'writeLockReferencedDocuments').mockImplementationOnce(async () => Promise.resolve());
        result = await upsertDocument(upsertRquest, mongoClienttMock as any);
      });

      it('should not retry', () => {
        expect(replaceOneMock).toHaveBeenCalledTimes(1);
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
