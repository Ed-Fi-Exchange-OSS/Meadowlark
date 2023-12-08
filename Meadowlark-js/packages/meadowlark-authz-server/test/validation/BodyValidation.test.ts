import { BodyValidation, Suggestion, applySuggestions, validateCreateClientBody } from '../../src/validation/BodyValidation';

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
        suggestions = validationResult.suggestions ?? [];
      });

      it('should return suggestions', () => {
        expect(validationResult).toBeTruthy();
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
        expect(validationResult).toBeTruthy();
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
        expect(validationResult).toBeTruthy();
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
  //   describe("given it's validating the update client body", () => {
  //     const body = {
  //       clientName: 'a',
  //       active: true,
  //       roles: [],
  //     };
  //   });
  //   describe("given it's validating the request token body", () => {
  //     const body = {
  //       grant_type: 'a',
  //       client_id: 'b',
  //       client_secret: 'c',
  //     };
  //   });
  //   describe("given it's validating the verify token body", () => {
  //     const body = {
  //       token: 'a',
  //       token_hint: '',
  //     };
  //   });
});
