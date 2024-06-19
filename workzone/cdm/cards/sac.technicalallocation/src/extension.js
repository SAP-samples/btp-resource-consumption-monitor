sap.ui.define([
    'sap/ui/integration/Extension'
], function (Extension) {
    'use strict'

    return Extension.extend('generic', {

        init: function () {
            Extension.prototype.init.apply(this, arguments)
        },

        onCardReady: async function () {
            // const iCard = this.getCard()
            // const data = await iCard.request({
            //     "url": "{{destinations.btprc-srv}}/odata/v4/analytics/getSACStoryUrl()",
            //     "withCredentials": true,
            //     "parameters": {}
            // })
            // console.log(data.url)

            // const { url } = data
            // iCard.getModel().setProperty('/sac_url', url)
            // console.log('Set SAC url to', url)
            // iCard.refresh()
        }

    })

})
