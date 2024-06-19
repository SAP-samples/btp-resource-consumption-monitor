sap.ui.define([
    'sap/ui/core/mvc/ControllerExtension',
    'sap/ui/model/Sorter'
], function (ControllerExtension, Sorter) {
    'use strict'

    return ControllerExtension.extend("managetags.ext.controller.ObjectPageExt", {
        override: {

            onBeforeRebindTableExtension: function (oEvent) {
                if (oEvent.getParameter('id').endsWith('managedTagAllocations::Table')) {
                    oEvent.getParameter('bindingParams')
                        .sorter = [
                            // Group By
                            new Sorter('name', false, function (oContext) {
                                const val = oContext.getProperty('name') || 'Undefined'
                                return { key: val, value: val }
                            }),
                            // Sort
                            new Sorter('value', false, false)
                        ]
                }
            }
        }

    })
})
