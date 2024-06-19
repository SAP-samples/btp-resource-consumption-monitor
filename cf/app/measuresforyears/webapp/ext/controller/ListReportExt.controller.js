sap.ui.define([
    'sap/ui/core/mvc/ControllerExtension',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator'
], function (ControllerExtension, Fragment, JSONModel, Filter, FilterOperator) {
    'use strict'

    let oGlobalFilter = null
    let fiYear = null

    return ControllerExtension.extend("measuresforyears.ext.controller.ListReportExt", {
        override: {

            onInitSmartFilterBarExtension: function (oEvent) {
                oGlobalFilter = oEvent.getSource()
                fiYear = oGlobalFilter.determineFilterItemByName('reportYear')

                if (fiYear && fiYear.getProperty('mandatory')) {
                    fiYear
                        .getControl()
                        .getBinding('items')
                        .attachEventOnce('dataReceived', () => {
                            const oControl = fiYear.getControl()
                            if (oControl.getItems().length > 0) {
                                oControl.setSelectedItem(oControl.getItems()[0], true, true)
                                oGlobalFilter.search()
                            }
                        })
                }

            }
        },

        handleLinkPress: function (oEvent) {
            const oButton = oEvent.getSource()
            const oView = this.getView()

            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "measuresforyears.ext.fragments.quickview",
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
