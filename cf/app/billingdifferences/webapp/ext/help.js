sap.ui.define([
    'sap/m/Dialog',
    'sap/m/Button',
    './libs/ui5-cc-md/Markdown'
], function (Dialog, Button, Markdown) {
    'use strict';

    return {

        openHelp: function () {
            const file = 'help.creditexpenditure.md'
            fetch(`https://raw.githubusercontent.com/SAP-samples/btp-resource-consumption-monitor/main/docs/snippets/${file}`)
                .then(content => content.text())
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

    }
})
