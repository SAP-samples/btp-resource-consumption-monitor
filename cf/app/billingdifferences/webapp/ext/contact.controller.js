sap.ui.define([
    'sap/ui/core/mvc/ControllerExtension',
    'sap/m/library'
], function (ControllerExtension, Library) {
    'use strict';

    const URLHelper = Library.URLHelper

    return ControllerExtension.extend('billingdifferences.ext.contact', {

        contactSAP: function (oEvent) {
            const data = oEvent.getSource().getBindingContext().getObject()

            const address = 'billing@sap.com'
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
