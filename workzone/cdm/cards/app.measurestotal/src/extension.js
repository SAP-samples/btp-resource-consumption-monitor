sap.ui.define([
    'sap/ui/integration/Extension'
], function (Extension) {
    'use strict'

    return Extension.extend('generic', {

        init: function () {
            Extension.prototype.init.apply(this, arguments)
        },

        onCardReady: function () {
            const { origin, pathname } = window.location
            const iCard = this.getCard()
            iCard.getModel().setProperty('/basePath', `${origin}${pathname}?sap-ushell-config=headerless`)

            console.log('Set base path to', origin, pathname)
        }

    })

})
