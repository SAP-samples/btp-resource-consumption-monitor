import cds from '@sap/cds'
import { Settings } from './settings'
import {
    AccountStructureItem,
    AccountStructureItems,
    CustomTags,
    ManagedTagAllocations,
    getPasteTagsDefaultValue
} from '#cds-models/ManageTagsService'
import { TPasteMode } from '#cds-models/types'
import {
    stringifyCustomTags,
    stringifyTagAllocations
} from './functions'
import { randomUUID as uuidv4 } from 'node:crypto'

const info = cds.log('manageTagsService').info

type tagsClipboard = {
    managedTagAllocations: ManagedTagAllocations,
    customTags: CustomTags
}

export default class ManageTagsService extends cds.ApplicationService {
    async init() {

        this.after('READ', AccountStructureItems, items => {
            items?.forEach(each => {
                each.tagTextManaged0 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag0))
                each.tagTextManaged1 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag1))
                each.tagTextManaged2 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag2))
                each.tagTextManaged3 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag3))
                each.tagTextManaged4 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag4))
                each.tagTextManaged5 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag5))
                each.tagTextManaged6 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag6))
                each.tagTextManaged7 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag7))
                each.tagTextManaged8 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag8))
                each.tagTextManaged9 = stringifyTagAllocations(each.managedTagAllocations?.filter(x => x.name == Settings.tagConfiguration.mappings.managedTag9))
                each.tagTextCustomTags = stringifyCustomTags(each.customTags?.filter(x => x.name !== 'Hierarchy')) // Show all but Hierarchy (can still be seen in the object page if needed)
            })
        })

        this.before('SAVE', AccountStructureItem, req => {
            const { data } = req
            if (data.managedTagAllocations && data.managedTagAllocations?.length > 0) {
                const sum = Object.entries(
                    data.managedTagAllocations.reduce((p, c) => {
                        p[c.name!] = (p[c.name!] ?? 0) + (c.pct ?? 0)
                        return p
                    }, {} as Record<string, number>)
                )
                const errorEntries = sum.filter(([k, v]) => v <= 0 || v > 100)
                errorEntries.length > 0 && req.error(400, errorEntries.map(([k, v]) => `Managed tag '${k}' has allocations that sum up to ${v}%. The sum has to be between 0 and 100%.`).join('\r\n'))

                const warningEntries = sum.filter(([k, v]) => v < 100)
                warningEntries.length > 0 && req.warn(warningEntries.map(([k, v]) => `Managed tag '${k}' has allocations that sum up to ${v}%. Your data is saved, but know it is incomplete as long as it is below 100%.`).join('\r\n'))
            }
        })

        let copyClipboards: Record<string, tagsClipboard> = {}
        this.on(getPasteTagsDefaultValue, () => { return { mode: TPasteMode.Both } })
        this.on(AccountStructureItem.actions.copyTags, async req => {
            const requestor = req.subject?.ref && req.subject.ref[0]?.id
            if (requestor == 'ManageTagsService.AccountStructureItems') {
                const { ID } = req.params[0] as { ID: string }
                info(`Copying tags for item ${ID}...`)

                const tags: tagsClipboard = await SELECT.from(AccountStructureItems, ID)
                    //@ts-expect-error
                    .columns(a => { a.managedTagAllocations(['name', 'value', 'pct']), a.customTags(['name', 'value']) })

                const copyClipboard = {
                    managedTagAllocations: tags.managedTagAllocations,
                    customTags: tags.customTags.filter(x => x.name !== 'Hierarchy')
                }
                copyClipboards[req.user.id] = copyClipboard

                const status = `${copyClipboard.managedTagAllocations.length} managed and ${copyClipboard.customTags.length} custom tags copied to clipboard for user ${req.user.id}.`
                info(status)
                return req.notify(status)
            } else {
                return req.reject(400, 'Copying is not possible while in edit mode.')
            }
        })
        this.on(AccountStructureItem.actions.pasteTags, async req => {
            const mode = req.data.mode as TPasteMode
            const requestor = req.subject?.ref && req.subject.ref[0]?.id
            const copyClipboard = copyClipboards[req.user.id]

            if (!copyClipboard || (copyClipboard.managedTagAllocations.length + copyClipboard.customTags.length == 0)) {
                return req.reject(400, `Nothing in clipboard yet for user ${req.user.id}.`)
            }
            if (requestor == 'ManageTagsService.AccountStructureItems') {
                const { ID } = req.params[0] as { ID: string }
                info(`Pasting tags in mode ${mode} to item ${ID}...`)

                const existingTags: tagsClipboard & { label: string } = await SELECT.from(AccountStructureItems, ID)
                    //@ts-expect-error
                    .columns(a => { a.label, a.managedTagAllocations(['ID', 'name', 'value']), a.customTags(['ID', 'name']) })

                let nCustomTags = 0
                if ((mode == TPasteMode.Both || mode == TPasteMode.Only2CustomTags) && copyClipboard.customTags.length > 0) {
                    copyClipboard.customTags.forEach(tag => {
                        tag.toAccountStructureItem_ID = ID
                        tag.ID = existingTags.customTags.find(x => x.name == tag.name)?.ID || uuidv4()
                    })
                    const n = await UPSERT.into(CustomTags).entries(copyClipboard.customTags)
                    nCustomTags = (Array.isArray(n) ? n : [n]).reduce((p: number, c: number) => (p ?? 0) + c)
                }

                let nManagedTags = 0
                if ((mode == TPasteMode.Both || mode == TPasteMode.Only1ManagedTags) && copyClipboard.managedTagAllocations.length > 0) {
                    copyClipboard.managedTagAllocations.forEach(tag => {
                        tag.toAccountStructureItem_ID = ID
                        tag.ID = existingTags.managedTagAllocations.find(x => x.name == tag.name && x.value == tag.value)?.ID || uuidv4()
                    })
                    const n = await UPSERT.into(ManagedTagAllocations).entries(copyClipboard.managedTagAllocations)
                    nManagedTags = (Array.isArray(n) ? n : [n]).reduce((p: number, c: number) => (p ?? 0) + c)
                }

                const status = `${existingTags.label}: ${nManagedTags} managed and ${nCustomTags} custom tags pasted.`
                info(status)
                return req.notify(status)
            } else {
                return req.reject(400, 'Pasting is not possible while in edit mode.')
            }
        })

        this.on(AccountStructureItem.actions.deleteTags, async req => {
            const mode = req.data.mode as TPasteMode
            const requestor = req.subject?.ref && req.subject.ref[0]?.id
            if (requestor == 'ManageTagsService.AccountStructureItems') {
                const { ID } = req.params[0] as { ID: string }
                info(`Deleting tags in mode ${mode} from item ${ID}...`)

                let nCustomTags = 0
                if (mode == TPasteMode.Both || mode == TPasteMode.Only2CustomTags) {
                    nCustomTags = await DELETE.from(CustomTags).where`(toAccountStructureItem_ID = ${ID} AND name <> 'Hierarchy')`
                }

                let nManagedTags = 0
                if (mode == TPasteMode.Both || mode == TPasteMode.Only1ManagedTags) {
                    nManagedTags = await DELETE.from(ManagedTagAllocations).where`(toAccountStructureItem_ID = ${ID})`
                }

                const status = `${nManagedTags} managed and ${nCustomTags} custom tags deleted.`
                info(status)
                return req.notify(status)
            } else {
                return req.reject(400, 'Deleting is not possible while in edit mode.')
            }
        })

        return super.init()
    }
}

