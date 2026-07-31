sap.ui.define([
    'sap/ui/core/mvc/ControllerExtension',
    'sap/m/library',
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast'
], function (ControllerExtension, Library, Fragment, JSONModel, MessageToast) {
    'use strict';

    const URLHelper = Library.URLHelper

    return ControllerExtension.extend('billingdifferences.ext.contact', {

        openComments: function (oEvent) {
            const oView = this.base.getView()
            const oSource = oEvent.getSource()
            const oContext = oSource.getBindingContext()
            const oRowData = oContext.getObject()

            // Store keys and row context for use in saveComments.
            // reportYearMonth is display-formatted (e.g. "July 2025") — use reportYearMonthRaw for the DB key.
            // AccountStructureItem_ID maps to globalAccountId: the BillingResolutions key uses the account ID.
            this._oCommentsContext = {
                reportYearMonth:         oRowData.reportYearMonthRaw || oRowData.reportYearMonth,
                AccountStructureItem_ID: oRowData.globalAccountId
            }
            this._oCommentsRowContext = oContext

            if (!this._oCommentsDialog) {
                this._oCommentsDialog = Fragment.load({
                    id: oView.getId(),
                    name: 'billingdifferences.ext.comments',
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog)
                    return oDialog
                })
            }

            this._oCommentsDialog.then(function (oDialog) {
                // Re-read the row data at open time to get the latest values from the model cache
                const oFreshData = oContext.getObject()
                const oCommentsModel = new JSONModel({
                    text: oFreshData.Resolution_comment ?? '',
                    resolved: oFreshData.Resolution_resolved ?? false
                })
                oDialog.setModel(oCommentsModel, 'commentsModel')
                // Clear any leftover validation state from a previous open
                const oTextArea = oDialog.getContent()[0].getContent()[0]
                oTextArea.setValueState('None')
                oDialog.open()
            })
        },

        saveComments: function () {
            const _self = this
            const oView = this.base.getView()
            const oKeys = this._oCommentsContext
            const oODataModel = oView.getModel()
            const sServiceUrl = oODataModel.getServiceUrl()

            this._oCommentsDialog.then(function (oDialog) {
                const oData = oDialog.getModel('commentsModel').getData()
                // TextArea is the first child of the VerticalLayout inside the dialog content
                const oTextArea = oDialog.getContent()[0].getContent()[0]

                // Validate: if marked resolved, a comment of at least 25 characters is required
                if (oData.resolved && (!oData.text || oData.text.trim().length < 25)) {
                    oTextArea.setValueState('Error')
                    oTextArea.setValueStateText('A comment of at least 25 characters is required when marking as resolved.')
                    return
                }
                // Clear any previous validation error
                oTextArea.setValueState('None')

                // Fetch CSRF token first, then POST
                fetch(sServiceUrl, {
                    method: 'GET',
                    headers: { 'X-CSRF-Token': 'Fetch' }
                }).then(function (oTokenResponse) {
                    const sCsrfToken = oTokenResponse.headers.get('X-CSRF-Token') || ''
                    return fetch(sServiceUrl + 'BillingResolutions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': sCsrfToken
                        },
                        body: JSON.stringify({
                            reportYearMonth:         oKeys.reportYearMonth,
                            AccountStructureItem_ID: oKeys.AccountStructureItem_ID,
                            comment:                 oData.text,
                            resolved:                oData.resolved
                        })
                    })
                }).then(function (oResponse) {
                    if (!oResponse.ok) {
                        return oResponse.text().then(function (sText) {
                            throw new Error('HTTP ' + oResponse.status + ': ' + sText)
                        })
                    }
                    oDialog.close()
                    // Refresh the list binding so the updated row (status/criticality) is re-fetched.
                    // We cannot refresh the row context directly: reportYearMonth is a key field that
                    // holds a display-transformed value ('May 2026'), which causes a 404 on key lookup.
                    // Instead, get the list binding from the row context's parent binding.
                    if (_self._oCommentsRowContext) {
                        const oListBinding = _self._oCommentsRowContext.getBinding()
                        if (oListBinding) oListBinding.refresh()
                    }
                }).catch(function (oError) {
                    console.error('Failed to save resolution:', oError)
                    MessageToast.show('Failed to save: ' + oError.message)
                })
            })
        },

        closeComments: function () {
            this._oCommentsDialog.then(function (oDialog) {
                oDialog.close()
            })
        },

        contactSAP: function (oEvent) {
            const data = oEvent.getSource().getBindingContext().getObject()

            const address = 'SAPBalanceStatement@sap.com'
            const subject = `Info request (${data.globalAccountName})`
            const body = `Dear,

I'm contacting you regarding the following consumption-based contract:

- Global account: ${data.globalAccountId} (${data.globalAccountName})
- Phase start date: ${data.Credits_phaseStartDate}
- Billing period: ${data.reportYearMonth}
- Reported billing difference: ${data.currency} ${data.Billing_difference}

Kindly contact me to discuss further.`

            URLHelper.triggerEmail(address, subject, body, '', '', true)
        }

    })
})
