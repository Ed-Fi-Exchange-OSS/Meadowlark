import { MetaEdPlugin, newMetaEdPlugin } from '@edfi/metaed-core';
import { enhancerList } from './enhancer/EnhancerList';

export { enhance as entityPropertyMeadowlarkDataSetupEnhancer } from './model/EntityPropertyMeadowlarkData';
export { enhance as entityMeadowlarkDataSetupEnhancer } from './model/EntityMeadowlarkData';
export { enhance as referenceComponentEnhancer } from './enhancer/ReferenceComponentEnhancer';
export { enhance as apiPropertyMappingEnhancer } from './enhancer/ApiPropertyMappingEnhancer';
export { enhance as propertyCollectingEnhancer } from './enhancer/PropertyCollectingEnhancer';
export { enhance as apiEntityMappingEnhancer } from './enhancer/ApiEntityMappingEnhancer';
export { enhance as subclassPropertyNamingCollisionEnhancer } from './enhancer/SubclassPropertyNamingCollisionEnhancer';
export { enhance as subclassPropertyCollectingEnhancer } from './enhancer/SubclassPropertyCollectingEnhancer';
export { enhance as subclassApiEntityMappingEnhancer } from './enhancer/SubclassApiEntityMappingEnhancer';

export { CollectedProperty } from './model/CollectedProperty';
export { EntityMeadowlarkData } from './model/EntityMeadowlarkData';
export { EntityPropertyMeadowlarkData } from './model/EntityPropertyMeadowlarkData';
export { prefixedName } from './model/PropertyModifier';
export { ReferenceComponent, ReferenceGroup, isReferenceElement } from './model/ReferenceComponent';
export { topLevelNameOnEntity, pluralize } from './Utility';
export { ApiPropertyMapping } from './model/ApiPropertyMapping';

export function initialize(): MetaEdPlugin {
  return {
    ...newMetaEdPlugin(),
    enhancer: enhancerList(),
  };
}
