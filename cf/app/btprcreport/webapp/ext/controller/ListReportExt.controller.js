sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "btprcreport/ext/controller/BulkTechnicalAllocationDialog",
    "btprcreport/ext/controller/BulkForecastDialog"
], function (ControllerExtension, BulkTechnicalAllocationDialog, BulkForecastDialog) {
    "use strict";

    return ControllerExtension.extend("btprcreport.ext.controller.ListReportExt", {
        // this section allows to extend lifecycle hooks or override public methods of the base controller
        override: {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf btprcreport.ext.controller.ListReportExt
             */
            onInit: function () {
                // Initialize bulk allocation dialog controller
                this._oBulkAllocationDialog = new BulkTechnicalAllocationDialog();
                // Initialize bulk forecast dialog controller
                this._oBulkForecastDialog = new BulkForecastDialog();
            }
        },

        /**
         * Handle the SetBulkTechnicalAllocations action
         * This method is called when the bulk technical allocation action is triggered from the Data Management menu
         * @param {sap.ui.base.Event} oEvent - The event object
         */
        onSetBulkTechnicalAllocations: function (oEvent) {
            // Get the base controller and model
            const oController = this.base.getView().getController();
            const oModel = this.base.getView().getModel();
            
            // Open the bulk technical allocation dialog
            this._oBulkAllocationDialog.open(oController, oModel);
        },

        /**
         * Handle the SetBulkForecastSettings action
         * This method is called when the bulk forecast settings action is triggered from the Data Management menu
         * @param {sap.ui.base.Event} oEvent - The event object
         */
        onSetBulkForecastSettings: function (oEvent) {
            // Get the base controller and model
            const oController = this.base.getView().getController();
            const oModel = this.base.getView().getModel();
            
            // Open the bulk forecast dialog
            this._oBulkForecastDialog.open(oController, oModel);
        }
    });
});
