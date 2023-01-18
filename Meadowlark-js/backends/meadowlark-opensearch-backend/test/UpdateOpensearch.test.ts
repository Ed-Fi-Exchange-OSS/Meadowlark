// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.

import { safelyLogOpenSearchErrors } from '../src/repository/UpdateOpensearch';

describe('when logging an OpenSearch error', () => {
  describe('given a mapping error containing PII', () => {
    // This is a real error that was seen in an unusual circumstance: there was an old (and incorrect) index on
    // cohortYear.schoolYearTypeReference, treating it as a number instead of an object. This error occurred on trying to
    // POST a new studentEducationOrganizationAssociation, with the proper cohortYear.
    const error = {
      error: {
        root_cause: [
          {
            type: 'mapper_parsing_exception',
            reason:
              "failed to parse field [cohortYears.schoolYearTypeReference] of type [long] in document with id 'hnla6CP3Tsu6AbU4cCW9vRq3u-jFhpeT8Z3uhw'. Preview of field's value: '{schoolYear=2022}'",
          },
        ],
        type: 'mapper_parsing_exception',
        reason:
          "failed to parse field [cohortYears.schoolYearTypeReference] of type [long] in document with id 'hnla6CP3Tsu6AbU4cCW9vRq3u-jFhpeT8Z3uhw'. Preview of field's value: '{schoolYear=2022}'",
        caused_by: {
          type: 'json_parse_exception',
          reason:
            'Current token (START_OBJECT) not numeric, can not use numeric value accessors\n at [Source: (byte[])"{"id":"hnla6CP3Tsu6AbU4cCW9vRq3u-jFhpeT8Z3uhw","info":"{\\"id\\":\\"hnla6CP3Tsu6AbU4cCW9vRq3u-jFhpeT8Z3uhw\\",\\"educationOrganizationReference\\":{\\"educationOrganizationId\\":120},\\"studentReference\\":{\\"studentUniqueId\\":\\"ed9c9bfe86cb\\"},\\"sexDescriptor\\":\\"uri://ed-fi.org/SexDescriptor#Female\\",\\"cohortYears\\":[{\\"schoolYearTypeReference\\":{\\"schoolYear\\":2022},\\"cohortYearTypeDescriptor\\":\\"uri://ed-fi.org/CohortYearTypeDescriptor#Twelfth grade\\"}]}","educationOrganizationReference":{"educationOr"[truncated 327 bytes]; line: 1, column: 672]',
        },
      },
      status: 400,
    };

    const expectedReturnValue = {
      error: {
        root_cause: [
          {
            type: 'mapper_parsing_exception',
            reason:
              "failed to parse field [cohortYears.schoolYearTypeReference] of type [long] in document with id 'hnla6CP3Tsu6AbU4cCW9vRq3u-jFhpeT8Z3uhw'.",
          },
        ],
      },
      status: 400,
    };

    /* Design comment Thought about trying to anonymize the detailed message and send to DEBUG log. The structure of the
      `reason` element in the error object would be very difficult to parse. Ultimately the effort is probably not worth the
      payback.
    */

    let result: any;

    beforeAll(() => {
      result = safelyLogOpenSearchErrors(error);
    });

    it('returns the status and root cause with field value anonymized', () => {
      expect(result).toMatchObject(expectedReturnValue);
    });
  });
});
