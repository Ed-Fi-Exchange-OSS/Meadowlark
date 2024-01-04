// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { baseURLRequest } from '../helpers/Shared';

describe('when accepting an incoming token request', () => {
  describe('given it does not have Transfer-Encoding or Content-Length headers', () => {
    it('should respond with 401', async () => {
      await baseURLRequest()
        .post('/oauth/token')
        .send({ grant_type: 'client_credentials', client_id: 'a', client_secret: 'b' })
        .expect(401);
    });
  });

  describe('given it has a Transfer-Encoding of gzip', () => {
    it('should respond with 400', async () => {
      await baseURLRequest()
        .post('/oauth/token')
        .set({ 'Transfer-Encoding': 'gzip' })
        .send({})
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "Bad Request",
              "message": "Client Error",
              "statusCode": 400,
            }
          `);
        });
    });
  });

  describe('given it has both Transfer-Encoding and Content-Length (proper case)', () => {
    it('should respond with 400', async () => {
      await baseURLRequest()
        .post('/oauth/token')
        .set({ 'Transfer-Encoding': 'chunked', 'Content-Length': 1 })
        .send({})
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "Bad Request",
              "message": "Client Error",
              "statusCode": 400,
            }
          `);
        });
    });
  });

  describe('given it has both Transfer-Encoding and Content-Length (lower case)', () => {
    it('should respond with 400', async () => {
      await baseURLRequest()
        .post('/oauth/token')
        .set({ 'transfer-encoding': 'chunked', 'content-length': 1 })
        .send({})
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "Bad Request",
              "message": "Client Error",
              "statusCode": 400,
            }
          `);
        });
    });
  });
});

describe('when accepting an incoming PUT request for a resource', () => {
  describe('given it does not have Transfer-Encoding or Content-Length headers', () => {
    it('should respond with 400', async () => {
      await baseURLRequest()
        .put('/v3.3b/ed-fi/persons')
        .send({ firstName: 'a' })
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "Invalid authorization header",
            }
          `);
        });
    });
  });

  describe('given it has a Transfer-Encoding of gzip', () => {
    it('should respond with 400', async () => {
      await baseURLRequest()
        .put('/v3.3b/ed-fi/students')
        .set({ 'Transfer-Encoding': 'gzip' })
        .send({})
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "Bad Request",
              "message": "Client Error",
              "statusCode": 400,
            }
          `);
        });
    });
  });

  describe('given it has a Transfer-Encoding of chunked', () => {
    it('should respond with 400', async () => {
      await baseURLRequest()
        .put('/v3.3b/ed-fi/students')
        .set({ 'Transfer-Encoding': 'chunked' })
        .send({})
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "Bad Request",
              "message": "Client Error",
              "statusCode": 400,
            }
          `);
        });
    });
  });

  describe('given it has both Transfer-Encoding and Content-Length (proper case)', () => {
    it('should respond with 400', async () => {
      await baseURLRequest()
        .put('/v3.3b/ed-fi/persons')
        .set({ 'Transfer-Encoding': 'chunked', 'Content-Length': 1 })
        .send({})
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "Bad Request",
              "message": "Client Error",
              "statusCode": 400,
            }
          `);
        });
    });
  });

  describe('given it has both Transfer-Encoding and Content-Length (lower case)', () => {
    it('should respond with 400', async () => {
      await baseURLRequest()
        .put('/v3.3b/ed-fi/persons')
        .set({ 'transfer-encoding': 'chunked', 'content-length': 1 })
        .send({})
        .expect(400)
        .then((response) => {
          expect(response.body).toMatchInlineSnapshot(`
            {
              "error": "Bad Request",
              "message": "Client Error",
              "statusCode": 400,
            }
          `);
        });
    });
  });
});
