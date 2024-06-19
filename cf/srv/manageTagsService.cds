using db from '../db/schema';
using types from '../db/types';

@requires: ['Viewer']
service ManageTagsService {

    @odata.draft.enabled
    entity AccountStructureItems as
        projection on db.AccountStructureItems {
            *,
            level || ': ' || name as label : String
        }
        excluding {
            label // label is a calculated field which is only compatible with draft handling using the new database services in the future
        }
        order by
            level,
            name
        actions {
            action copyTags();
            @Common.DefaultValuesFunction: 'getPasteTagsDefaultValue'
            action pasteTags(mode : types.TPasteTagsParams:mode);
            @Common.DefaultValuesFunction: 'getPasteTagsDefaultValue'
            action deleteTags(mode : types.TPasteTagsParams:mode);
        };

    function getPasteTagsDefaultValue() returns types.TPasteTagsParams;

    @readonly
    entity CodeLists             as projection on db.CodeLists;

    entity CL_TagsLifecycles     as projection on CodeLists[list = 'TagsLifecycles'];
    entity CL_TagLevels          as projection on CodeLists[list = 'TagLevels'];
    entity CL_TagEnvironments    as projection on CodeLists[list = 'TagEnvironments'];
    entity CL_ManagedTagNames    as projection on CodeLists[list = 'ManagedTagNames'];
    entity CL_PasteTagModes      as projection on CodeLists[list = 'PasteTagModes'];

}
