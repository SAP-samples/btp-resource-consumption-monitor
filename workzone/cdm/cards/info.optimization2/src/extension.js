sap.ui.define([
    'sap/ui/integration/Extension',
    'sap/m/Dialog',
    'sap/m/Button',
    './libs/ui5-cc-md/Markdown'
], function (Extension, Dialog, Button, Markdown) {
    'use strict'

    return Extension.extend('generic', {

        init: function () {
            Extension.prototype.init.apply(this, arguments)
            this.attachAction(this._handleAction.bind(this))
        },

        _handleAction: function (oEvent) {
            oEvent.preventDefault()
            const { url } = oEvent.getParameter('parameters').data

            this.getCard()
                .request({
                    method: 'GET',
                    url
                })
                .then(content => {
                    if (!this.oDialog) {
                        this.oDialog = new Dialog({
                            title: 'Documentation',
                            content: new Markdown({ content }),
                            endButton: new Button({
                                text: 'Close',
                                press: function () { this.getParent().close() }
                            })
                        })
                        this.oDialog.addStyleClass('sapUiContentPadding')
                    }
                    this.oDialog.open()
                })
        }

    })

})
