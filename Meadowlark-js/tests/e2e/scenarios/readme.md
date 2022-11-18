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
- [Limit without Offset validation](./QueryStringValidation.test.ts#L125)
- [Request by valid date](./QueryStringValidation.test.ts#L177)
- [Request by invalid date](./QueryStringValidation.test.ts#L190)
- [Request by not specified date](./QueryStringValidation.test.ts#L210)
- [Request by end date](./QueryStringValidation.test.ts#L223)
- [Request by string identifier](./QueryStringValidation.test.ts#L234)
- [Request by integer](./QueryStringValidation.test.ts#L247)

## Resources Reference Validation

- [Reference does not exist when creating with strict validation](./ResourcesReferenceValidation.test.ts#L14) *Duplicated*
- [Creating resource with existing reference](./ResourcesReferenceValidation.test.ts#L43) *Duplicated*
- [Allows adding when reference exists](./ResourcesReferenceValidation.test.ts#L73) *Duplicated*  
  
## Schema Validation

- [Missing required property](./SchemaValidation.test.ts#L9)
- [Empty array on required collection](./SchemaValidation.test.ts#L39)
- [Empty descriptor value](./SchemaValidation.test.ts#L69)
- [Empty required string value](./SchemaValidation.test.ts#L104)
- [Missing number property](./SchemaValidation.test.ts#L141)
- [Empty arrays on optional collections](./SchemaValidation.test.ts#L177)
- [Incorrect date formats](./SchemaValidation.test.ts#L212)

## Authorization Validation

- [Error creating second admin user](./AuthorizationValidation.test.ts#L19)
- [Create user with valid role combination](./AuthorizationValidation.test.ts#L34)
- [Create user with invalid role combination](./AuthorizationValidation.test.ts#L60)
- [Create user with too many roles](./AuthorizationValidation.test.ts#L93)
- [Create user with invalid role name](./AuthorizationValidation.test.ts#L121)
- [Missing client name](./AuthorizationValidation.test.ts#L166)
- [Invalid client name](./AuthorizationValidation.test.ts#L191)
- Retrieve client information

## Authentication Validation

- [Invalid grant type](./AuthenticationValidation.test.ts#L15)
- [Invalid key](./AuthenticationValidation.test.ts#L35)
- [Invalid secret](./AuthenticationValidation.test.ts#L48)
- Expired key (This might be possible when RND-444 is done setting up the OAUTH_EXPIRATION_MINUTES to a minimum value and waiting, while this does not affect the other tests)
- Client not found
- Admin client not found

- Permissions to read resources for vendors (could reuse existing scenarios)
