# Test List

## Abstract Entity Validation

- [Should not allow post on an abstract entity](./AbstractEntityValidation.test.ts#L10)

## Descriptor Reference Validation

- [Reference does not exist when creating with strict validation](./DescriptorReferenceValidation.test.ts#L15)
- [Allows adding when reference exists](./DescriptorReferenceValidation.test.ts#L43)
- [Allows edition when reference exists](./DescriptorReferenceValidation.test.ts#L76)
- [Token with relaxed validation allows invalid descriptors](./DescriptorReferenceValidation.test.ts#L120)

## Query String Validation

- [Should return total count](./QueryStringValidation.test.ts#L12)
- [Request with Limit](./QueryStringValidation.test.ts#L35)
- [Request with Limit. Invalid values](./QueryStringValidation.test.ts#L50)
- [Request with Offset](./QueryStringValidation.test.ts#L74)
- [Request with Offset. Greater than total](./QueryStringValidation.test.ts#L88)
- [Request with Offset. Invalid values](./QueryStringValidation.test.ts#L104)
- [Limit without Offset validation](./QueryStringValidation.test.ts#L126)

## Resources Reference Validation

- [Reference does not exist when creating with strict validation](./ResourcesReferenceValidation.test.ts#L14) *Duplicated*
- [Creating resource with existing reference](./ResourcesReferenceValidation.test.ts#L43) *Duplicated*
- [Allows adding when reference exists](./ResourcesReferenceValidation.test.ts#L73) *Duplicated*  
  
## Schema Validation

- [Missing required property](./SchemaValidation.test.ts#L13)
- [Empty array on required collection](./SchemaValidation.test.ts#L42)
- [Empty descriptor value](./SchemaValidation.test.ts#L72)
- [Empty required string value](./SchemaValidation.test.ts#L107)
- [Missing number property](./SchemaValidation.test.ts#L144)
- [Empty arrays on optional collections](./SchemaValidation.test.ts#L180)
- [Incorrect date formats](./SchemaValidation.test.ts#L223)
