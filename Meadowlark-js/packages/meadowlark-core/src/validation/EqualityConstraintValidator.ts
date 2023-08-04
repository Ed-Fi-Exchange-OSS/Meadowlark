// SPDX-License-Identifier: Apache-2.0
// Licensed to the Ed-Fi Alliance under one or more agreements.
// The Ed-Fi Alliance licenses this file to you under the Apache License, Version 2.0.
// See the LICENSE and NOTICES files in the project root for more information.
import { JSONPath as jsonPath } from 'jsonpath-plus';
import { TopLevelEntity } from '@edfi/metaed-core';
import type { EntityApiSchemaData, EqualityConstraint } from '@edfi/metaed-plugin-edfi-api-schema';

// By using the jsonpath library's "flatten" flag, we should only get back primitive types in the array
type PrimitiveType = number | string | boolean;

/**
 * Returns true if every element of the given array is equal, or if the array is empty.
 * Used as the equality test on the results of the JSONPath execution.
 * It's fine if the array is empty because element optionality is a possibility.
 */
function allEqual(array: PrimitiveType[]): boolean {
  if (array.length === 0) return true;
  return array.every((element) => element === array[0]);
}

/**
 * Validates the equality constraints defined in MetaEd model are correct for the given API body.
 *
 * Returns a list of validation failure messages.
 */
export function validateEqualityConstraints(matchingMetaEdModel: TopLevelEntity, parsedBody: any): string[] {
  const validationFailures: string[] = [];

  const { equalityConstraints } = matchingMetaEdModel.data.edfiApiSchema as EntityApiSchemaData;

  equalityConstraints.forEach((equalityConstraint: EqualityConstraint) => {
    const sourceValues: PrimitiveType[] = jsonPath({
      path: equalityConstraint.sourceJsonPath,
      json: parsedBody,
      flatten: true,
    });

    const targetValues: PrimitiveType[] = jsonPath({
      path: equalityConstraint.targetJsonPath,
      json: parsedBody,
      flatten: true,
    });

    if (!allEqual(sourceValues.concat(targetValues))) {
      validationFailures.push(
        `Constraint failure: document paths ${equalityConstraint.sourceJsonPath} and ${equalityConstraint.targetJsonPath} must have the same values`,
      );
    }
  });

  return validationFailures;
}
