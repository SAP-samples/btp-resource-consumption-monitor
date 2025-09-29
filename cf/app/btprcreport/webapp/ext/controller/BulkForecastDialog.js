sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Panel",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Text",
    "sap/m/ComboBox",
    "sap/m/Input",
    "sap/ui/core/Item",
    "sap/ui/core/Icon",
    "sap/ui/core/Element"
], function (Controller, Fragment, JSONModel, MessageToast, MessageBox, Panel, VBox, HBox, Text, ComboBox, Input, Item, Icon, CoreElement) {
    "use strict";

    return Controller.extend("btprcreport.ext.controller.BulkForecastDialog", {

        /**
         * Opens the bulk forecast settings dialog
         * @param {sap.ui.core.mvc.Controller} oParentController - The parent controller
         * @param {sap.ui.model.odata.v4.ODataModel} oModel - The OData model
         */
        open: function (oParentController, oModel) {
            this._oParentController = oParentController;
            this._oModel = oModel;
            this._conflictsOnly = false;
            this._searchTerm = "";

            // Show busy indicator on parent view
            oParentController.getView().setBusy(true);

            if (!this._oDialog) {
                Fragment.load({
                    name: "btprcreport.ext.fragments.BulkForecastDialog",
                    controller: this
                }).then(function (oDialog) {
                    this._oDialog = oDialog;
                    oParentController.getView().addDependent(this._oDialog);
                    this._initializeDialog();
                }.bind(this)).catch(function (error) {
                    oParentController.getView().setBusy(false);
                    MessageBox.error("Failed to load dialog: " + error.message);
                }.bind(this));
            } else {
                this._initializeDialog();
            }
        },

        /**
         * Initialize dialog with data
         */
        _initializeDialog: function () {
            this._loadData().then(function () {
                this._buildServicePanels();
                this._oDialog.open();
                // Hide busy indicator once everything is loaded
                this._oParentController.getView().setBusy(false);
            }.bind(this)).catch(function (error) {
                // Hide busy indicator on error
                this._oParentController.getView().setBusy(false);
                MessageBox.error("Failed to load data: " + error.message);
            }.bind(this));
        },

        /**
         * Load forecast settings data
         */
        _loadData: function () {
            const oModel = this._oModel;

            // Load bulk forecast data from the dedicated backend view
            const bulkDataPromise = new Promise((resolve, reject) => {
                const oBinding = oModel.bindList("/BulkForecastSettings");

                oBinding.requestContexts().then(contexts => {
                    const bulkData = contexts.map(context => context.getObject());
                    resolve(bulkData);
                }).catch(reject);
            });

            // Load available forecast methods
            const forecastMethodsPromise = new Promise((resolve, reject) => {
                const oBinding = oModel.bindList("/CL_ForecastMethods");

                oBinding.requestContexts().then(contexts => {
                    const methods = contexts.map(context => context.getObject());
                    resolve(methods);
                }).catch(reject);
            });

            return Promise.all([bulkDataPromise, forecastMethodsPromise]).then(([bulkData, forecastMethods]) => {
                this._bulkData = bulkData;
                this._forecastMethods = forecastMethods;

                // Initialize forecast settings model
                this._initializeForecastModel();
            });
        },

        /**
         * Initialize the forecast settings data model
         */
        _initializeForecastModel: function () {
            const settings = [];
            const conflicts = [];

            // Use the simplified bulk data from the backend view
            this._bulkData.forEach(item => {
                const setting = {
                    serviceId: item.serviceId,
                    serviceName: item.serviceName,
                    cMeasureId: item.cMeasureId,
                    cMetricName: item.cMetricName,
                    method: item.method || "Excluded",
                    degressionFactor: item.degressionFactor || 1,
                    statusText: item.statusText || "Excluded from forecasting",
                    originalMethod: item.method || "Excluded",
                    originalDegressionFactor: item.degressionFactor || 1,
                    proposedMethod: "",
                    proposedDegressionFactor: 1,
                    hasConflict: false,
                    hasProposal: false,
                    status: "current" // current, proposed, conflict
                };
                settings.push(setting);
            });

            this._forecastModel = new JSONModel({
                settings: settings,
                conflicts: conflicts,
                conflictsOnly: false
            });

            this._oDialog.setModel(this._forecastModel, "forecasts");
        },

        /**
         * Build service panels dynamically
         */
        _buildServicePanels: function () {
            const oContainer = CoreElement.getElementById("forecastServicesContainer");
            oContainer.destroyItems();

            const services = this._forecastModel.getProperty("/settings")
                .reduce((acc, setting) => {
                    if (!acc[setting.serviceId]) {
                        acc[setting.serviceId] = {
                            serviceId: setting.serviceId,
                            serviceName: setting.serviceName,
                            settings: []
                        };
                    }
                    acc[setting.serviceId].settings.push(setting);
                    return acc;
                }, {});

            // Filter services based on search term
            const filteredServices = Object.values(services).filter(service => {
                if (!this._searchTerm) {
                    return true; // Show all services if no search term
                }
                return service.serviceName.toLowerCase().includes(this._searchTerm.toLowerCase());
            });

            if (filteredServices.length === 0 && this._searchTerm) {
                // Show "No services found" message
                const oNoResultsText = new Text({
                    text: `No services found matching "${this._searchTerm}"`,
                    textAlign: "Center"
                });
                oNoResultsText.addStyleClass("sapUiMediumMargin");
                oContainer.addItem(oNoResultsText);
            } else {
                filteredServices.forEach(service => {
                    const oPanel = this._createServicePanel(service);
                    oContainer.addItem(oPanel);
                });
            }
        },

        /**
         * Create a panel for a service
         */
        _createServicePanel: function (service) {
            const oPanel = new Panel({
                headerText: `${service.serviceName} (${service.settings.length} metrics)`,
                expandable: true,
                expanded: true
            });
            oPanel.addStyleClass("sapUiTinyMarginBottom");

            const oContent = new VBox();
            oContent.addStyleClass("sapUiSmallMargin");

            service.settings.forEach((setting, index) => {
                if (!this._conflictsOnly || setting.hasConflict) {
                    const oMetricRow = this._createMetricRow(setting, service.serviceId, index);
                    oContent.addItem(oMetricRow);
                }
            });

            oPanel.addContent(oContent);
            return oPanel;
        },

        /**
         * Create a row for a metric forecast setting
         */
        _createMetricRow: function (setting, serviceId, index) {
            const oRow = new HBox({
                justifyContent: "SpaceBetween",
                alignItems: "Center"
            });
            oRow.addStyleClass("sapUiTinyMarginBottom");

            // Metric name
            const oMetricText = new Text({
                text: setting.cMetricName,
                width: "200px"
            });
            oMetricText.addStyleClass("sapUiTinyMarginEnd");

            // Status icon
            const oStatusIcon = new Icon({
                src: this._getStatusIcon(setting),
                color: this._getStatusColor(setting),
                width: "30px",
                tooltip: this._getStatusTooltip(setting)
            });
            oStatusIcon.addStyleClass("sapUiTinyMarginEnd");

            // Forecast method selector
            const oMethodCombo = new ComboBox({
                selectedKey: setting.method,
                width: "150px",
                change: this._onForecastMethodChange.bind(this, serviceId, setting.cMeasureId)
            });

            // Add forecast method items
            this._forecastMethods.forEach(method => {
                oMethodCombo.addItem(new Item({
                    key: method.code,
                    text: method.description
                }));
            });

            // Degression factor input (only visible for TimeDegressive method)
            const oDegressionInput = new Input({
                value: setting.degressionFactor.toString(),
                type: "Number",
                width: "80px",
                editable: setting.method === "TimeDegressive",
                change: this._onDegressionFactorChange.bind(this, serviceId, setting.cMeasureId),
                valueState: "None"
            });

            // Degression factor label
            const oDegressionLabel = new Text({
                text: "Factor:",
                width: "45px"
            });
            oDegressionLabel.addStyleClass("sapUiTinyMarginStart");

            // Degression factor label
            const oMethodLabel = new Text({
                text: "Method:",
                width: "55px"
            });
            oMethodLabel.addStyleClass("sapUiTinyMarginStart");
            
            oRow.addItem(oMetricText);
            oRow.addItem(oMethodLabel);
            oRow.addItem(oMethodCombo);
            oRow.addItem(oDegressionLabel);
            oRow.addItem(oDegressionInput);
            oRow.addItem(oStatusIcon);

            return oRow;
        },

        /**
         * Get status icon for forecast setting
         */
        _getStatusIcon: function (setting) {
            if (setting.hasConflict) {
                return "sap-icon://warning";
            } else if (setting.hasProposal) {
                return "sap-icon://ai";
            } else if (setting.method !== "Excluded") {
                return "sap-icon://complete";
            }
            return "sap-icon://cancel";
        },

        /**
         * Get status color for forecast setting
         */
        _getStatusColor: function (setting) {
            if (setting.hasConflict) {
                return "Critical";
            } else if (setting.hasProposal) {
                return "Marker";
            } else if (setting.method !== "Excluded") {
                return "Positive";
            }
            return "Default";
        },

        /**
         * Get status tooltip for forecast setting
         */
        _getStatusTooltip: function (setting) {
            if (setting.hasConflict) {
                return "Proposed setting differs from current";
            } else if (setting.hasProposal) {
                return "Auto-generated proposal";
            } else if (setting.method !== "Excluded") {
                return `Configured: ${setting.method}`;
            }
            return "Excluded from forecasting";
        },

        /**
         * Handle forecast method selection change
         */
        _onForecastMethodChange: function (serviceId, cMeasureId, oEvent) {
            const oComboBox = oEvent.getSource();
            const sSelectedKey = oComboBox.getSelectedKey();

            const settings = this._forecastModel.getProperty("/settings");
            const setting = settings.find(s =>
                s.serviceId === serviceId && s.cMeasureId === cMeasureId
            );

            if (setting) {
                setting.method = sSelectedKey;
                
                // Reset degression factor if not TimeDegressive
                if (sSelectedKey !== "TimeDegressive") {
                    setting.degressionFactor = 1;
                }

                this._updateSettingStatus(setting);
                this._forecastModel.setProperty("/settings", settings);
                this._updateConflictSummary();

                // Rebuild the service panels to update visibility and status icons
                this._buildServicePanels();
            }
        },

        /**
         * Handle degression factor change
         */
        _onDegressionFactorChange: function (serviceId, cMeasureId, oEvent) {
            const oInput = oEvent.getSource();
            const fValue = parseFloat(oInput.getValue()) || 1;

            // Validate range (0-10)
            if (fValue < 0 || fValue > 10) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Degression factor must be between 0 and 10");
                return;
            } else {
                oInput.setValueState("None");
            }

            const settings = this._forecastModel.getProperty("/settings");
            const setting = settings.find(s =>
                s.serviceId === serviceId && s.cMeasureId === cMeasureId
            );

            if (setting) {
                setting.degressionFactor = fValue;
                this._updateSettingStatus(setting);
                this._forecastModel.setProperty("/settings", settings);
                this._updateConflictSummary();

                // Update status icon
                this._buildServicePanels();
            }
        },

        /**
         * Update setting status based on changes
         */
        _updateSettingStatus: function (setting) {
            const hasOriginalMethod = setting.originalMethod !== "Excluded";
            const hasCurrentMethod = setting.method !== "Excluded";
            const hasProposal = !!setting.proposedMethod;

            const methodChanged = setting.method !== setting.originalMethod;
            const factorChanged = setting.degressionFactor !== setting.originalDegressionFactor;

            if (hasProposal && setting.method === setting.proposedMethod) {
                setting.status = "proposed";
                setting.hasProposal = true;
                setting.hasConflict = methodChanged || factorChanged;
            } else if (methodChanged || factorChanged) {
                setting.status = "conflict";
                setting.hasConflict = true;
                setting.hasProposal = false;
            } else {
                setting.status = "current";
                setting.hasConflict = false;
                setting.hasProposal = false;
            }
        },

        /**
         * Generate automatic proposals based on historical data patterns
         */
        onGenerateProposal: function () {
            MessageToast.show(`Not implemented`);

            // // Reset search when generating proposals
            // this._resetSearch();

            // const settings = this._forecastModel.getProperty("/settings");
            // let proposalCount = 0;

            // settings.forEach(setting => {
            //     const proposal = this._generateProposalForMetric(setting);
            //     if (proposal && (proposal.method !== setting.method || proposal.degressionFactor !== setting.degressionFactor)) {
            //         // Only set as proposal if it's different from current value
            //         setting.proposedMethod = proposal.method;
            //         setting.proposedDegressionFactor = proposal.degressionFactor;
            //         setting.method = proposal.method;
            //         setting.degressionFactor = proposal.degressionFactor;
            //         this._updateSettingStatus(setting);
            //         proposalCount++;
            //     }
            // });

            // this._forecastModel.setProperty("/settings", settings);
            // this._buildServicePanels(); // Rebuild to show new proposals
            // this._updateConflictSummary();

            // MessageToast.show(`Generated ${proposalCount} automatic proposals`);
        },

        /**
         * Generate proposal for a single metric using smart logic
         */
        _generateProposalForMetric: function (setting) {
            const metricName = setting.cMetricName.toLowerCase();

            // Simple proposal logic based on metric characteristics
            let proposedMethod = "TimeLinear";
            let proposedDegressionFactor = 1;

            // If metric name suggests variable usage patterns, use degressive
            if (metricName.includes("request") || 
                metricName.includes("api") || 
                metricName.includes("call") ||
                metricName.includes("transaction")) {
                proposedMethod = "TimeDegressive";
                proposedDegressionFactor = 2.0;
            }
            
            // If metric name suggests steady usage, use linear
            else if (metricName.includes("storage") || 
                     metricName.includes("memory") || 
                     metricName.includes("capacity")) {
                proposedMethod = "TimeLinear";
            }
            
            // If metric name suggests high variability, use degressive with higher factor
            else if (metricName.includes("peak") || 
                     metricName.includes("burst") || 
                     metricName.includes("max")) {
                proposedMethod = "TimeDegressive";
                proposedDegressionFactor = 3.0;
            }

            return {
                method: proposedMethod,
                degressionFactor: proposedDegressionFactor
            };
        },

        /**
         * Clear all forecast settings (set to Excluded)
         */
        onClearAll: function () {
            // Reset search when clearing all
            this._resetSearch();

            const settings = this._forecastModel.getProperty("/settings");
            settings.forEach(setting => {
                setting.method = "Excluded";
                setting.degressionFactor = 1;
                setting.proposedMethod = "";
                setting.proposedDegressionFactor = 1;
                this._updateSettingStatus(setting);
            });

            this._forecastModel.setProperty("/settings", settings);
            this._buildServicePanels();
            this._updateConflictSummary();

            MessageToast.show("All forecast settings cleared");
        },

        /**
         * Toggle showing conflicts only
         */
        onToggleConflictsOnly: function () {
            // Reset search when toggling conflicts
            this._resetSearch();

            this._conflictsOnly = !this._conflictsOnly;
            this._forecastModel.setProperty("/conflictsOnly", this._conflictsOnly);

            const oLink = CoreElement.getElementById("forecastShowConflictsOnlyLink");
            oLink.setText(this._conflictsOnly ? "Show all metrics" : "Show conflicts only");

            this._buildServicePanels();
        },

        /**
         * Update conflict summary
         */
        _updateConflictSummary: function () {
            const settings = this._forecastModel.getProperty("/settings");
            const conflicts = settings.filter(s => s.hasConflict);
            const proposals = settings.filter(s => s.hasProposal);

            const oSummary = CoreElement.getElementById("forecastConflictSummary");
            const oSummaryText = CoreElement.getElementById("forecastConflictSummaryText");

            // If we're showing conflicts only but there are no more conflicts, switch back to showing all
            if (this._conflictsOnly && conflicts.length === 0) {
                this._conflictsOnly = false;
                this._forecastModel.setProperty("/conflictsOnly", this._conflictsOnly);

                const oLink = CoreElement.getElementById("forecastShowConflictsOnlyLink");
                oLink.setText("Show conflicts only");

                // Rebuild panels to show all metrics again
                this._buildServicePanels();
            }

            if (conflicts.length > 0 || proposals.length > 0) {
                let text = "";
                if (conflicts.length > 0) {
                    text += `${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''}`;
                }
                if (proposals.length > 0) {
                    if (text) text += ", ";
                    text += `${proposals.length} proposal${proposals.length !== 1 ? 's' : ''}`;
                }

                oSummaryText.setText(text);
                oSummary.setVisible(true);
            } else {
                oSummary.setVisible(false);
            }
        },

        /**
         * Handle search input
         */
        onSearch: function (oEvent) {
            const sQuery = oEvent.getParameter("query") || oEvent.getParameter("newValue") || "";
            this._searchTerm = sQuery.trim();
            this._buildServicePanels();
        },

        /**
         * Reset search field and term
         */
        _resetSearch: function () {
            this._searchTerm = "";
            const oSearchField = CoreElement.getElementById("forecastSearchField");
            if (oSearchField) {
                oSearchField.setValue("");
            }
        },

        /**
         * Show help information
         */
        onShowHelp: function () {
            MessageBox.information(
                "Bulk Forecast Settings Help:\n\n" +
                "• Use 'Generate Proposal' to automatically suggest forecast methods based on metric characteristics\n" +
                "• TimeLinear: Simple linear forecasting for steady growth patterns\n" +
                "• TimeDegressive: Advanced forecasting with degression factor for variable patterns\n" +
                "• Excluded: Remove metric from forecasting calculations\n" +
                "• Degression factor (0-10): Higher values = more conservative forecasting\n" +
                "• Green checkmarks indicate configured forecast methods\n" +
                "• Yellow warnings show conflicts between current and proposed settings\n" +
                "• Use 'Clear All' to exclude all metrics from forecasting\n" +
                "• Use the search field to filter services by name",
                {
                    title: "Help"
                }
            );
        },

        /**
         * Save all forecast settings
         */
        onSave: function () {
            const settings = this._forecastModel.getProperty("/settings");
            const changedSettings = settings.filter(s =>
                s.method !== s.originalMethod ||
                s.degressionFactor !== s.originalDegressionFactor
            );

            if (changedSettings.length === 0) {
                MessageToast.show("No changes to save");
                return;
            }

            // Show busy indicator during save
            this._oDialog.setBusy(true);

            // Prepare data for backend
            const settingsData = changedSettings.map(setting => ({
                serviceId: setting.serviceId,
                cMeasureId: setting.cMeasureId,
                method: setting.method,
                degressionFactor: setting.degressionFactor
            }));

            // Call backend action
            const oBinding = this._oModel.bindContext("/SetBulkForecastSettings(...)");
            oBinding.setParameter("settings", settingsData);

            oBinding.execute().then(() => {
                this._oDialog.setBusy(false);
                MessageToast.show(`Successfully updated ${changedSettings.length} forecast settings`);
                this._oDialog.close();

                // Refresh the main view
                if (this._oParentController.getView().getModel().refresh) {
                    this._oParentController.getView().getModel().refresh();
                }
            }).catch(error => {
                this._oDialog.setBusy(false);
                MessageBox.error("Failed to save forecast settings: " + error.message);
            });
        },

        /**
         * Cancel dialog
         */
        onCancel: function () {
            this._oDialog.close();
        },

        /**
         * Clean up data when dialog closes
         */
        onAfterClose: function () {
            // Clear the forecast model
            if (this._forecastModel) {
                this._forecastModel.setData({
                    settings: [],
                    conflicts: [],
                    conflictsOnly: false
                });
            }

            // Clear the service panels container
            const oContainer = CoreElement.getElementById("forecastServicesContainer");
            if (oContainer) {
                oContainer.destroyItems();
            }

            // Hide conflict summary
            const oSummary = CoreElement.getElementById("forecastConflictSummary");
            if (oSummary) {
                oSummary.setVisible(false);
            }

            // Reset conflicts only mode
            this._conflictsOnly = false;
            const oLink = CoreElement.getElementById("forecastShowConflictsOnlyLink");
            if (oLink) {
                oLink.setText("Show conflicts only");
            }

            // Reset search
            this._resetSearch();
        }
    });
});
