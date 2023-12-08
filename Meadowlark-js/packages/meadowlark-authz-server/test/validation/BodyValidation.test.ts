import {
  BodyValidation,
  Suggestion,
  applySuggestions,
  validateCreateClientBody,
  validateRequestTokenBody,
} from '../../src/validation/BodyValidation';

describe("given it's validating the request body", () => {
  describe("given it's validating the create client body", () => {
    describe("given it's valid", () => {
      const expected = {
        clientName: 'Hometown SIS',
        roles: ['vendor', 'assessment'],
      };
      let validationResult: BodyValidation;

      beforeAll(() => {
        // Act
        validationResult = validateCreateClientBody(expected);
      });

      it('should return valid', () => {
        expect(validationResult).toBeTruthy();
      });
    });

    describe('given it has different casing', () => {
      const actual = {
        clientname: 'Hometown SIS',
        ROLES: ['vendor', 'assessment'],
      };

      const expected = {
        clientName: 'Hometown SIS',
        roles: ['vendor', 'assessment'],
      };

      let validationResult: BodyValidation;
      let suggestions: Suggestion[] = [];

      beforeAll(() => {
        // Act
        validationResult = validateCreateClientBody(actual);
        if (!validationResult.isValid) {
          suggestions = validationResult.suggestions ?? [];
        }
      });

      it('should return suggestions', () => {
        if (validationResult.isValid) {
          expect(validationResult.isValid).toBeFalsy();
          return;
        }

        expect(validationResult.failureMessage).toMatchInlineSnapshot(`
          [
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'clientName'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'roles'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'clientname' property is not expected to be here",
              "path": "{requestBody}",
              "suggestion": "Did you mean property 'clientName'?",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'ROLES' property is not expected to be here",
              "path": "{requestBody}",
            },
          ]
        `);
        expect(validationResult.suggestions).toMatchInlineSnapshot(`
          [
            {
              "current": "clientname",
              "suggested": "clientName",
            },
            {
              "current": "ROLES",
              "suggested": "roles",
            },
          ]
        `);
      });

      it('should apply suggestions correctly', () => {
        expect(applySuggestions(actual, suggestions)).toMatchObject(expected);
      });
    });

    describe('given it has additional properties', () => {
      const actual = {
        clientName: 'Hometown SIS',
        roles: ['vendor', 'assessment'],
        extra: true,
      };

      let validationResult: BodyValidation;

      beforeAll(() => {
        // Act
        validationResult = validateCreateClientBody(actual);
      });

      it('should return error message with no suggestions', () => {
        if (validationResult.isValid) {
          expect(validationResult.isValid).toBeFalsy();
          return;
        }
        expect(validationResult.failureMessage).toMatchInlineSnapshot(`
          [
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'extra' property is not expected to be here",
              "path": "{requestBody}",
            },
          ]
        `);
        expect(validationResult.suggestions).toEqual([]);
      });
    });

    describe('given it has a typo', () => {
      const actual = {
        clientNane: 'Hometown SIS',
        roles: ['vendor', 'assessment'],
      };

      let validationResult: BodyValidation;

      beforeAll(() => {
        // Act
        validationResult = validateCreateClientBody(actual);
      });

      it('should return suggestions', () => {
        if (validationResult.isValid) {
          expect(validationResult.isValid).toBeFalsy();
          return;
        }
        expect(validationResult.failureMessage).toMatchInlineSnapshot(`
          [
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'clientName'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'clientNane' property is not expected to be here",
              "path": "{requestBody}",
              "suggestion": "Did you mean property 'clientName'?",
            },
          ]
        `);
        expect(validationResult.suggestions).toEqual([]);
      });
    });
  });

  describe("given it's validating the request token body", () => {
    describe("given it's valid", () => {
      const expected = {
        grant_type: 'client_credentials',
        client_id: 'Hometown SIS',
        client_secret: '123456',
      };
      let validationResult: BodyValidation;

      beforeAll(() => {
        // Act
        validationResult = validateRequestTokenBody(expected);
      });

      it('should return valid', () => {
        expect(validationResult).toBeTruthy();
      });
    });

    describe('given it has different casing', () => {
      const actual = {
        GRANT_TYPE: 'client_credentials',
        CLIENT_ID: 'Hometown SIS',
        CLIENT_SECRET: '123456',
      };

      const expected = {
        grant_type: 'client_credentials',
        client_id: 'Hometown SIS',
        client_secret: '123456',
      };

      let validationResult: BodyValidation;
      let suggestions: Suggestion[] = [];

      beforeAll(() => {
        // Act
        validationResult = validateRequestTokenBody(actual);
        if (!validationResult.isValid) {
          suggestions = validationResult.suggestions ?? [];
        }
      });

      it('should return suggestions', () => {
        if (validationResult.isValid) {
          expect(validationResult.isValid).toBeFalsy();
          return;
        }
        expect(validationResult.failureMessage).toMatchInlineSnapshot(`
          [
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'grant_type'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'GRANT_TYPE' property is not expected to be here",
              "path": "{requestBody}",
              "suggestion": "Did you mean property 'grant_type'?",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'CLIENT_ID' property is not expected to be here",
              "path": "{requestBody}",
              "suggestion": "Did you mean property 'client_id'?",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'CLIENT_SECRET' property is not expected to be here",
              "path": "{requestBody}",
              "suggestion": "Did you mean property 'grant_type'?",
            },
          ]
        `);
        expect(validationResult.suggestions).toMatchInlineSnapshot(`
          [
            {
              "current": "GRANT_TYPE",
              "suggested": "grant_type",
            },
            {
              "current": "CLIENT_ID",
              "suggested": "client_id",
            },
            {
              "current": "CLIENT_SECRET",
              "suggested": "client_secret",
            },
          ]
        `);
      });

      it('should apply suggestions correctly', () => {
        expect(applySuggestions(actual, suggestions)).toMatchObject(expected);
      });
    });

    describe('given it has a typo', () => {
      const actual = {
        grant_types: 'client_credentials',
        clientid: 'Hometown SIS',
        'client-secret': '123456',
      };

      let validationResult: BodyValidation;

      beforeAll(() => {
        // Act
        validationResult = validateRequestTokenBody(actual);
      });

      it('should return suggestions', () => {
        if (validationResult.isValid) {
          expect(validationResult.isValid).toBeFalsy();
          return;
        }
        expect(validationResult.failureMessage).toMatchInlineSnapshot(`
          [
            {
              "context": {
                "errorType": "required",
              },
              "message": "{requestBody} must have required property 'grant_type'",
              "path": "{requestBody}",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'grant_types' property is not expected to be here",
              "path": "{requestBody}",
              "suggestion": "Did you mean property 'grant_type'?",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'clientid' property is not expected to be here",
              "path": "{requestBody}",
              "suggestion": "Did you mean property 'client_id'?",
            },
            {
              "context": {
                "errorType": "additionalProperties",
              },
              "message": "'client-secret' property is not expected to be here",
              "path": "{requestBody}",
              "suggestion": "Did you mean property 'client_secret'?",
            },
          ]
        `);
        expect(validationResult.suggestions).toEqual([]);
      });
    });
  });
});
