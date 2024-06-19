sap.ui.define(["sap/ui/integration/Extension"], function (Extension) {
	"use strict"

	return Extension.extend("cards.top5forecast.afterReadExtension", {
		init: function () {
			Extension.prototype.init.apply(this, arguments)
			this.setFormatters({
				convertCriticality: function (status) {
					const map = {
						1: 'Error',
						2: 'Warning',
						3: 'Success',
						0: 'None',
						5: 'Information'
					}
					return map[status] || 'Information'
				}.bind(this)
			})
		}
	})
})
