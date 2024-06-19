sap.ui.define([
    'sap/ui/core/mvc/ControllerExtension',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (ControllerExtension, Fragment, JSONModel, Filter, FilterOperator) {
    'use strict'

    let oGlobalFilter = null
    let fiTagsName = null
    let fiTagsValue = null
    let fiInterval = null
    let fiRetrieved = null

    return ControllerExtension.extend("measuresbytags.ext.controller.ListReportExt", {
        override: {

            onInitSmartFilterBarExtension: function (oEvent) {
                oGlobalFilter = oEvent.getSource()
                fiTagsName = oGlobalFilter.determineFilterItemByName('Tag_name')
                fiTagsValue = oGlobalFilter.determineFilterItemByName('Tag_value')
                fiInterval = oGlobalFilter.determineFilterItemByName('interval')
                fiRetrieved = oGlobalFilter.determineFilterItemByName('retrieved')

                oGlobalFilter.setFilterData({
                    ...fiRetrieved && fiRetrieved.getProperty('mandatory') && {
                        retrieved: {
                            conditionTypeInfo: {
                                name: 'sap.ui.comp.config.condition.DateRangeType',
                                data: {
                                    operation: 'TODAY',
                                    value1: null,
                                    value2: null,
                                    key: 'retrieved',
                                    calendarType: 'Gregorian'
                                }
                            },
                            ranges: [],
                            items: []
                        }
                    },
                    ...fiInterval && fiInterval.getProperty('mandatory') && { interval: "Daily" }
                })

                if (fiTagsName && fiTagsName.getProperty('mandatory') && fiTagsValue && fiTagsValue.getProperty('mandatory')) {
                    fiTagsName
                        .getControl()
                        .attachSelectionChange(this.onTagsNameChange)

                    fiTagsValue
                        .getControl()
                        .getBinding('items')
                        .attachEvent('dataReceived', () => {
                            const oControl = fiTagsValue.getControl()
                            if (oControl.getBinding('items').getAllCurrentContexts().length && oControl.getItems().length > 0) {
                                oControl.setSelectedItem(oControl.getItems()[0], true, true)
                                oGlobalFilter.search()
                            }
                        })

                    fiTagsName
                        .getControl()
                        .getBinding('items')
                        .attachEventOnce('dataReceived', () => {
                            const oControl = fiTagsName.getControl()
                            if (oControl.getItems().length > 0) {
                                oControl.setSelectedItem(oControl.getItems()[0], true, true)
                                this.onTagsNameChange()
                            }
                        })
                }
            }
        },

        onTagsNameChange: function () {
            const tags_name = fiTagsName.getControl().getSelectedItem()?.getText()
            if (tags_name && fiTagsValue) {
                fiTagsValue
                    .getControl()
                    .getBinding('items')
                    .filter([new Filter("tag_name", FilterOperator.EQ, tags_name)])
                fiTagsValue
                    .getControl()
                    .setSelectedKey(null)
            }
        },

        handleLinkPress: function (oEvent) {
            const oButton = oEvent.getSource()
            const oView = this.getView()

            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "measuresbytags.ext.fragments.quickview",
                    controller: this
                }).then(oPopover => {
                    oView.addDependent(oPopover)
                    return oPopover
                })
            }

            this._pPopover.then(oPopover => {
                const data = oButton.getBindingContext().getObject()
                const popupData = {
                    title: data.AccountStructureItem_label,
                    items: data.Measures_serviceNames
                        .split('__')
                        .map(x => {
                            return { item: x }
                        })
                }
                oPopover.setModel(new JSONModel(popupData), 'context')
                oPopover.openBy(oButton)
            })

        }

    })
})
