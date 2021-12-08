# MetaEd to ODS/API Surface

While Ed-Fi models are described using the MetaEd language, their most common expression is as the API surface of an
ODS/API implementation.  The mapping between MetaEd models and their API surface expression is largely straightforward,
but there are some important differences.

## Element Naming

### Casing
Names on the ODS/API surface are always lower camel cased, whereas names in MetaEd models are always upper camel cased.

### Simple Names
For the most part, the names of individual elements are the same between the MetaEd model and ODS/API surface.
MetaEd "role names" are expressed as prefixes on the property name.

### Name Overlap Collasping
The ODS/API surface has naming rules that remove overlapping prefixes of properties that match the parent entity name in some cases. As a simple example, a MetaEd property "XyzAbcd" on an entity "Xyz" may be expressed in the API as "Abcd". However, the rules for name collasping can get quite involved in complex cases, and is beyond the scope of this document.

## References
In general, a reference on the ODS/API surface is made up of the set of individual natural key values that specify
the referenced entity. This set is wrapped by an object named "xyzReference", where "xyz" is the singularized name of the
entity being referred to.

### Reference Collections
Reference collections are arrays of single item references where the array is named as the pluralized name of the entity
being referred to.

### Descriptors
References to descriptors are suffixed by "Descriptor" instead of "Reference" like all other entity references.

## Choice and Inline Common
There are no direct equivalents to MetaEd Choice and Inline Common entities in the ODS/API. Instead, they are considered
more like bags of properties which are pulled up to the same level as the entity with the Choice/Inline Common reference.
Since references to Choice/Inline Common can be nested, the pull-up can happen from multiple levels.