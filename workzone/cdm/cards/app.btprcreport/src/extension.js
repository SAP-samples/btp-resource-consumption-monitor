sap.ui.define([
    'sap/ui/integration/Extension'
], function (Extension) {
    'use strict'

    return Extension.extend('generic', {

        init: function () {
            Extension.prototype.init.apply(this, arguments)
        },

        onCardReady: function () {
            const { origin, pathname, search } = window.location
            const path = (search && search.length > 0)
                ? `${origin}${pathname}${search}&sap-ushell-config=headerless`
                : `${origin}${pathname}?sap-ushell-config=headerless`

            const iCard = this.getCard()
            iCard.getModel().setProperty('/basePath', path)

            console.log('Set base path to', path)
        }

    })

})
