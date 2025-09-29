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
    "sap/ui/core/Item",
    "sap/ui/core/Icon",
    "sap/ui/core/Element"
], function (Controller, Fragment, JSONModel, MessageToast, MessageBox, Panel, VBox, HBox, Text, ComboBox, Item, Icon, CoreElement) {
    "use strict";

    return Controller.extend("btprcreport.ext.controller.BulkTechnicalAllocationDialog", {

        /**
         * Opens the bulk technical allocation dialog
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
                    name: "btprcreport.ext.fragments.BulkTechnicalAllocationDialog",
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
         * Load commercial and technical metrics data
         */
        _loadData: function () {
            const oModel = this._oModel;

            // Load bulk allocation data from the dedicated backend view
            const bulkDataPromise = new Promise((resolve, reject) => {
                const oBinding = oModel.bindList("/BulkTechnicalAllocations");

                oBinding.requestContexts().then(contexts => {
                    const bulkData = contexts.map(context => context.getObject());
                    resolve(bulkData);
                }).catch(reject);
            });

            // Load available technical metrics for each service
            const technicalPromise = new Promise((resolve, reject) => {
                const oBinding = oModel.bindList("/unique_TMetricsByServices");

                oBinding.requestContexts().then(contexts => {
                    const technicalMetrics = contexts.map(context => context.getObject());

                    // Group by service
                    const groupedByService = {};
                    technicalMetrics.forEach(metric => {
                        if (!groupedByService[metric.serviceId]) {
                            groupedByService[metric.serviceId] = [];
                        }
                        groupedByService[metric.serviceId].push(metric);
                    });

                    resolve(groupedByService);
                }).catch(reject);
            });

            return Promise.all([bulkDataPromise, technicalPromise]).then(([bulkData, technicalMetrics]) => {
                this._bulkData = bulkData;
                this._technicalMetrics = technicalMetrics;

                // Initialize allocations model
                this._initializeAllocationsModel();
            });
        },

        /**
         * Initialize the allocations data model
         */
        _initializeAllocationsModel: function () {
            const allocations = [];
            const conflicts = [];

            // Use the simplified bulk data from the backend view
            this._bulkData.forEach(item => {
                const allocation = {
                    serviceId: item.serviceId,
                    serviceName: item.serviceName,
                    cMeasureId: item.cMeasureId,
                    cMetricName: item.cMetricName,
                    tMeasureId: item.tMeasureId || "",
                    tMetricName: item.tMetricName || "",
                    originalTMeasureId: item.tMeasureId || "",
                    proposedTMeasureId: "",
                    proposedTMetricName: "",
                    hasConflict: false,
                    hasProposal: false,
                    status: "current" // current, proposed, conflict
                };
                allocations.push(allocation);
            });

            this._allocationsModel = new JSONModel({
                allocations: allocations,
                conflicts: conflicts,
                conflictsOnly: false
            });

            this._oDialog.setModel(this._allocationsModel, "allocations");
        },

        /**
         * Build service panels dynamically
         */
        _buildServicePanels: function () {
            const oContainer = CoreElement.getElementById("servicesContainer")
            // const oContainer = CoreElement.getElementById("servicesContainer");
            oContainer.destroyItems();

            const services = this._allocationsModel.getProperty("/allocations")
                .reduce((acc, allocation) => {
                    if (!acc[allocation.serviceId]) {
                        acc[allocation.serviceId] = {
                            serviceId: allocation.serviceId,
                            serviceName: allocation.serviceName,
                            allocations: []
                        };
                    }
                    acc[allocation.serviceId].allocations.push(allocation);
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
                headerText: `${service.serviceName} (${service.allocations.length} metrics)`,
                expandable: true,
                expanded: true
            });
            oPanel.addStyleClass("sapUiTinyMarginBottom");

            const oContent = new VBox();
            oContent.addStyleClass("sapUiSmallMargin");

            service.allocations.forEach((allocation, index) => {
                if (!this._conflictsOnly || allocation.hasConflict) {
                    const oMetricRow = this._createMetricRow(allocation, service.serviceId, index);
                    oContent.addItem(oMetricRow);
                }
            });

            oPanel.addContent(oContent);
            return oPanel;
        },

        /**
         * Create a row for a metric allocation
         */
        _createMetricRow: function (allocation, serviceId, index) {
            const oRow = new HBox({
                justifyContent: "SpaceBetween",
                alignItems: "Center"
            });
            oRow.addStyleClass("sapUiTinyMarginBottom");

            // Metric name
            const oMetricText = new Text({
                text: allocation.cMetricName,
                width: "250px"
            });
            oMetricText.addStyleClass("sapUiTinyMarginEnd");
            oMetricText.addStyleClass("sapUiTinyWidth");

            // Status icon
            const oStatusIcon = new Icon({
                src: this._getStatusIcon(allocation),
                color: this._getStatusColor(allocation),
                width: "30px",
                tooltip: this._getStatusTooltip(allocation)
            });
            oStatusIcon.addStyleClass("sapUiTinyMarginEnd");

            // Technical metric selector
            const oTechnicalCombo = new ComboBox({
                value: allocation.tMetricName,
                placeholder: "Select technical metric...",
                width: "300px",
                change: this._onTechnicalMetricChange.bind(this, serviceId, allocation.cMeasureId)
            });

            // Add items for technical metrics
            const technicalMetricsForService = this._technicalMetrics[serviceId] || [];
            technicalMetricsForService.forEach(metric => {
                oTechnicalCombo.addItem(new Item({
                    key: metric.measureId,
                    text: metric.metricName
                }));
            });

            // Add empty option to clear allocation
            oTechnicalCombo.addItem(new Item({
                key: "",
                text: "(Remove allocation)"
            }));

            oRow.addItem(oMetricText);
            oRow.addItem(oTechnicalCombo);
            oRow.addItem(oStatusIcon);

            return oRow;
        },

        /**
         * Get status icon for allocation
         */
        _getStatusIcon: function (allocation) {
            if (allocation.hasConflict) {
                return "sap-icon://warning";
            } else if (allocation.hasProposal) {
                return "sap-icon://ai";
            } else if (allocation.tMeasureId) {
                return "sap-icon://complete";
            }
            return "sap-icon://cancel";
        },

        /**
         * Get status color for allocation
         */
        _getStatusColor: function (allocation) {
            if (allocation.hasConflict) {
                return "Critical";
            } else if (allocation.hasProposal) {
                return "Marker";
            } else if (allocation.tMeasureId) {
                return "Positive";
            }
            return "Default";
        },

        /**
         * Get status tooltip for allocation
         */
        _getStatusTooltip: function (allocation) {
            if (allocation.hasConflict) {
                return "Proposed allocation differs from current";
            } else if (allocation.hasProposal) {
                return "Auto-generated proposal";
            } else if (allocation.tMeasureId) {
                return "Currently allocated";
            }
            return "No allocation";
        },

        /**
         * Handle technical metric selection change
         */
        _onTechnicalMetricChange: function (serviceId, cMeasureId, oEvent) {
            const oComboBox = oEvent.getSource();
            const sSelectedKey = oComboBox.getSelectedKey();
            const sSelectedText = oComboBox.getValue();

            const allocations = this._allocationsModel.getProperty("/allocations");
            const allocation = allocations.find(a =>
                a.serviceId === serviceId && a.cMeasureId === cMeasureId
            );

            if (allocation) {
                allocation.tMeasureId = sSelectedKey;
                allocation.tMetricName = sSelectedText === "(Remove allocation)" ? "" : sSelectedText;
                this._updateAllocationStatus(allocation);
                this._allocationsModel.setProperty("/allocations", allocations);
                this._updateConflictSummary();

                // Rebuild the service panels to update the status icons
                this._buildServicePanels();
            }
        },

        /**
         * Update allocation status based on changes
         */
        _updateAllocationStatus: function (allocation) {
            const hasOriginal = !!allocation.originalTMeasureId;
            const hasCurrent = !!allocation.tMeasureId;
            const hasProposal = !!allocation.proposedTMeasureId;

            if (hasProposal && allocation.tMeasureId === allocation.proposedTMeasureId) {
                allocation.status = "proposed";
                allocation.hasProposal = true;
                allocation.hasConflict = hasOriginal && allocation.originalTMeasureId !== allocation.tMeasureId;
            } else if (hasOriginal && hasCurrent && allocation.originalTMeasureId !== allocation.tMeasureId) {
                allocation.status = "conflict";
                allocation.hasConflict = true;
                allocation.hasProposal = false;
            } else {
                allocation.status = "current";
                allocation.hasConflict = false;
                allocation.hasProposal = false;
            }
        },

        /**
         * Generate automatic proposals
         */
        onGenerateProposal: function () {
            // Reset search when generating proposals
            this._resetSearch();

            const allocations = this._allocationsModel.getProperty("/allocations");
            let proposalCount = 0;

            allocations.forEach(allocation => {
                const proposal = this._generateProposalForMetric(allocation);
                if (proposal && proposal.measureId !== allocation.tMeasureId) {
                    // Only set as proposal if it's different from current value
                    allocation.proposedTMeasureId = proposal.measureId;
                    allocation.proposedTMetricName = proposal.metricName;
                    allocation.tMeasureId = proposal.measureId;
                    allocation.tMetricName = proposal.metricName;
                    this._updateAllocationStatus(allocation);
                    proposalCount++;
                }
            });

            this._allocationsModel.setProperty("/allocations", allocations);
            this._buildServicePanels(); // Rebuild to show new proposals
            this._updateConflictSummary();

            MessageToast.show(`Generated ${proposalCount} automatic proposals`);
        },

        /**
         * Generate proposal for a single metric using smart matching
         */
        _generateProposalForMetric: function (allocation) {
            const technicalMetrics = this._technicalMetrics[allocation.serviceId] || [];
            if (technicalMetrics.length === 0) return null;

            const commercialName = allocation.cMetricName.toLowerCase();

            // Smart matching algorithm
            let bestMatch = null;
            let bestScore = 0;

            technicalMetrics.forEach(technical => {
                const technicalName = technical.metricName.toLowerCase();
                let score = 0;

                // Exact match gets highest score
                if (commercialName === technicalName) {
                    score = 100;
                } else {
                    // Word-based matching
                    const commercialWords = commercialName.split(/[\s-_]+/);
                    const technicalWords = technicalName.split(/[\s-_]+/);

                    let matchingWords = 0;
                    commercialWords.forEach(cWord => {
                        if (technicalWords.some(tWord =>
                            tWord.includes(cWord) || cWord.includes(tWord)
                        )) {
                            matchingWords++;
                        }
                    });

                    score = (matchingWords / Math.max(commercialWords.length, technicalWords.length)) * 80;

                    // Bonus for similar patterns
                    if (commercialName.includes("storage") && technicalName.includes("storage")) score += 10;
                    if (commercialName.includes("memory") && technicalName.includes("memory")) score += 10;
                    if (commercialName.includes("cpu") && technicalName.includes("cpu")) score += 10;
                    if (commercialName.includes("request") && technicalName.includes("request")) score += 10;
                }

                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = technical;
                }
            });

            // Only return matches with reasonable confidence
            return bestScore >= 30 ? bestMatch : null;
        },

        /**
         * Clear all allocations
         */
        onClearAll: function () {
            // Reset search when clearing all
            this._resetSearch();

            const allocations = this._allocationsModel.getProperty("/allocations");
            allocations.forEach(allocation => {
                allocation.tMeasureId = "";
                allocation.tMetricName = "";
                allocation.proposedTMeasureId = "";
                allocation.proposedTMetricName = "";
                this._updateAllocationStatus(allocation);
            });

            this._allocationsModel.setProperty("/allocations", allocations);
            this._buildServicePanels();
            this._updateConflictSummary();

            MessageToast.show("All allocations cleared");
        },

        /**
         * Toggle showing conflicts only
         */
        onToggleConflictsOnly: function () {
            // Reset search when toggling conflicts
            this._resetSearch();

            this._conflictsOnly = !this._conflictsOnly;
            this._allocationsModel.setProperty("/conflictsOnly", this._conflictsOnly);

            const oLink = CoreElement.getElementById("showConflictsOnlyLink");
            oLink.setText(this._conflictsOnly ? "Show all metrics" : "Show conflicts only");

            this._buildServicePanels();
        },

        /**
         * Update conflict summary
         */
        _updateConflictSummary: function () {
            const allocations = this._allocationsModel.getProperty("/allocations");
            const conflicts = allocations.filter(a => a.hasConflict);
            const proposals = allocations.filter(a => a.hasProposal);

            const oSummary = CoreElement.getElementById("conflictSummary");
            const oSummaryText = CoreElement.getElementById("conflictSummaryText");

            // If we're showing conflicts only but there are no more conflicts, switch back to showing all
            if (this._conflictsOnly && conflicts.length === 0) {
                this._conflictsOnly = false;
                this._allocationsModel.setProperty("/conflictsOnly", this._conflictsOnly);

                const oLink = CoreElement.getElementById("showConflictsOnlyLink");
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
            const oSearchField = CoreElement.getElementById("searchField");
            if (oSearchField) {
                oSearchField.setValue("");
            }
        },

        /**
         * Show help information
         */
        onShowHelp: function () {
            MessageBox.information(
                "Bulk Technical Allocation Help:\n\n" +
                "• Use 'Generate Proposal' to automatically suggest technical metrics based on name matching\n" +
                "• Green checkmarks indicate current allocations\n" +
                "• Yellow warnings show conflicts between current and proposed allocations\n" +
                "• Blue info icons show new auto-generated proposals\n" +
                "• Use 'Clear All' to remove all allocations\n" +
                "• Use the search field to filter services by name\n" +
                "• Click 'Show conflicts only' to focus on items needing attention",
                {
                    title: "Help"
                }
            );
        },

        /**
         * Save all allocations
         */
        onSave: function () {
            const allocations = this._allocationsModel.getProperty("/allocations");
            const changedAllocations = allocations.filter(a =>
                a.tMeasureId !== a.originalTMeasureId ||
                (!a.originalTMeasureId && a.tMeasureId)
            );

            if (changedAllocations.length === 0) {
                MessageToast.show("No changes to save");
                return;
            }

            // Show busy indicator during save
            this._oDialog.setBusy(true);

            // Prepare data for backend
            const allocationData = changedAllocations.map(allocation => ({
                serviceId: allocation.serviceId,
                cMeasureId: allocation.cMeasureId,
                tMeasureId: allocation.tMeasureId,
                metricName: allocation.tMetricName
            }));

            // Call backend action
            const oBinding = this._oModel.bindContext("/SetBulkTechnicalAllocations(...)");
            oBinding.setParameter("allocations", allocationData);

            oBinding.execute().then(() => {
                this._oDialog.setBusy(false);
                MessageToast.show(`Successfully updated ${changedAllocations.length} allocations`);
                this._oDialog.close();

                // Refresh the main view
                // if (this._oParentController.getView().getModel().refresh) {
                //     this._oParentController.getView().getModel().refresh();
                // }
            }).catch(error => {
                this._oDialog.setBusy(false);
                MessageBox.error("Failed to save allocations: " + error.message);
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
            // Clear the allocations model
            if (this._allocationsModel) {
                this._allocationsModel.setData({
                    allocations: [],
                    conflicts: [],
                    conflictsOnly: false
                });
            }

            // Clear the service panels container
            const oContainer = CoreElement.getElementById("servicesContainer");
            if (oContainer) {
                oContainer.destroyItems();
            }

            // Hide conflict summary
            const oSummary = CoreElement.getElementById("conflictSummary");
            if (oSummary) {
                oSummary.setVisible(false);
            }

            // Reset conflicts only mode
            this._conflictsOnly = false;
            const oLink = CoreElement.getElementById("showConflictsOnlyLink");
            if (oLink) {
                oLink.setText("Show conflicts only");
            }

            // Reset search
            this._resetSearch();
        }
    });
});
