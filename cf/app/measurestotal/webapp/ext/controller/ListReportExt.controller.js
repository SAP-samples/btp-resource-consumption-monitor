sap.ui.define([
    'sap/ui/core/mvc/ControllerExtension',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (ControllerExtension, Fragment, JSONModel, Filter, FilterOperator) {
    'use strict'

    let oGlobalFilter = null
    let fiInterval = null
    let fiRetrieved = null

    return ControllerExtension.extend("measurestotal.ext.controller.ListReportExt", {
        override: {

            onInitSmartFilterBarExtension: function (oEvent) {
                oGlobalFilter = oEvent.getSource()
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

                if (fiInterval && fiInterval.getProperty('mandatory')) {
                    fiInterval
                        .getControl()
                        .getBinding('items')
                        .attachEventOnce('dataReceived', () => oGlobalFilter.search())
                }

            }
        },

        handleLinkPress: function (oEvent) {
            const oButton = oEvent.getSource()
            const oView = this.getView()

            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "measurestotal.ext.fragments.quickview",
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
