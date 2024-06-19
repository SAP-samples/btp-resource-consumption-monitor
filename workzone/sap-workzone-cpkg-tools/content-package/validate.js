module.exports.validate = function (dir) {
	const fs = require("fs-extra"),
		path = require("path"),
		util = require("../util/util.js"),
		validation = require("../util/validation.js").validation,
		handlebars = require("handlebars"),
		propertiesReader = require("properties-reader"),
		{ template } = require("handlebars"),
		packageDir = path.join(dir, "package"),
		packageJson = util.json.fromFile(path.join(dir, "package.json")),
		packageManifest = util.json.fromFile(path.join(packageDir, "manifest.json")),
		files = {
			"/manifest.json": packageManifest,
			"/package.json": packageJson
		};

	var packageValidators = {
		"package.1": {
			file: "/package.json",
			message: "Checking package.json name",
			error: "name not found in package.json",
			check: function (json) {
				return !!json["name"];
			}
		},
		"package.2": {
			file: "/package.json",
			message: "Checking version",
			error: "version not found in package.json",
			check: function (json) {
				this.result = json["version"];
				return !!json["version"];
			}
		},
		"package.3": {
			file: "/package.json",
			message: "Checking author",
			error: "author not found in package.json",
			check: function (json) {
				this.result = json["author"];
				return !!json["author"];
			}
		},
		"sap.package.1": {
			file: "/manifest.json",
			message: "Checking sap.package entry exists",
			error: "No sap.package entry found",
			check: function (json) {
				return !!json["sap.package"];
			}
		},
		"sap.package.2": {
			file: "/manifest.json",
			message: "Checking sap.package is object",
			error: "sap.package is not an object",
			check: function (json) {
				return validation.isObject(json["sap.package"]);
			}
		},
		"sap.package.3": {
			file: "/manifest.json",
			message: "Is sap.package the only element",
			error: "sap.package cannot have siblings besides _version",
			check: function (json) {
				var keys = Object.keys(json);
				for (var i = 0; i < keys.length; i++) {
					if (keys[i] != "sap.package" && keys[i] != "_version") {
						return false;
					}
				}
				return true
			}
		},
		"sap.package/id.1": {
			file: "/manifest.json",
			message: "Has valid sap.package/id",
			error: "sap.package/id needs to be defined, string and contain a unique namespace with at least 2 segments separated by '.', should not be cpkg.project.template",
			check: function (json) {
				var s = json["sap.package"].id;
				if (typeof s !== "string") return false;
				if (s.indexOf(".") === -1) return false;
				if (s.indexOf("cpkg.project.template") === 0) return false;
				return true
			}
		},
		"sap.package/packageVersion.1": {
			file: "/manifest.json",
			message: "Has valid sap.package/packageVersion",
			error: "sap.package/packageVersion needs to be an object containing at least a version string with semantic versioning (3 segments separated by '.'). No leading zeros and other allowed.",
			check: function (json) {
				var o = json["sap.package"].packageVersion;
				if (!validation.isObject(o)) return false;
				var s = json["sap.package"].packageVersion.version;
				if (s !== packageValidators["package.2"].result) {
					this.hint = "Version in package.json does not match version in manifest.json. Keeping them in sync is highly recommended."
				}
				if (typeof s !== "string") return false;
				var v = s.split(".");
				if (v.length !== 3) return false;
				if (v[0].length < 1) return false;
				if ((parseInt(v[0]) + "").length !== v[0].length) return false;
				if (v[1].length < 1) return false;
				if ((parseInt(v[1]) + "").length !== v[1].length) return false;
				if (v[2].length < 1) return false;
				if ((parseInt(v[2]) + "").length !== v[2].length) return false;
				return true
			}
		},
		"sap.package/packageVersion.2": {
			file: "/manifest.json",
			message: "Has a sap.package/packageVersion/upgradeNotification and is valid",
			error: "sap.package/packageVersion/upgradeNotification has an invalid value, use 'all','major.minor', 'major' or 'none'",
			hint: "sap.package/packageVersion/upgradeNotification is not defined and will default to 'all', this means the customer will needs to manually accept upgrades. Consider to define 'none', 'major' or 'major.minor' if necessary",
			check: function (json) {
				var s;
				try {
					s = json["sap.package"].packageVersion.upgradeNotification;
					if (s) {
						if (typeof s === "string") {
							switch (s) {
								case "all":
								case "major":
								case "major.minor":
								case "none":
									return true;
								default: return false
							}
						} else {
							return false;
						}
					}
				} catch (e) { }
				if (!s) {
					return "hint"
				}
				return true
			}
		},
		"sap.package/vendor.1": {
			file: "/manifest.json",
			message: "Checking sap.package/vendor is object",
			error: "sap.package/vendor is not an object",
			check: function (json) {
				return !validation.isObject(json["sap.package"].vendor);
			}
		},
		"sap.package/vendor.1": {
			file: "/manifest.json",
			message: "Checking sap.package/vendor is object",
			error: "sap.package/vendor is not an object",
			check: function (json) {
				return validation.isObject(json["sap.package"].vendor);
			}
		},
		"sap.package/vendor.2": {
			file: "/manifest.json",
			message: "Checking sap.package/vendor settings name",
			error: "sap.package/vendor/name is not defined or is empty",
			check: function (json) {
				return validation.hasStringEntry(json["sap.package"].vendor, "name");
			}
		},
		"sap.package/vendor.2": {
			file: "/manifest.json",
			message: "Checking sap.package/vendor settings url",
			error: "sap.package/vendor/url is not defined, is empty, does not start with 'https://' or is not a valid url (at least https://xx.yy)",
			check: function (json) {
				return validation.hasStringEntry(json["sap.package"].vendor, "url", 13, "https://");
			}
		},
		"sap.package/i18n.1": {
			file: "/manifest.json",
			message: "Checking sap.package/i18n settings",
			hint: "No i18n.properties entry available. Translation of string in manifests is highly recommended if used for content packages that reach other customers or regions. For customer installations that only need one language, the entry can be skipped.",
			check: function (json) {
				var result = validation.hasStringEntry(json["sap.package"], "i18n", 15, "i18n", "properties");
				if (result) {
					return true;
				}
				return "hint";
			}
		},
		"sap.package/i18n.2": {
			file: "/manifest.json",
			message: "Using translations",
			error: "If translations are used an i18n entry is required",
			check: function (json) {
				if (packageValidators["sap.package/i18n.1"].result === "hint") {
					return "skipped";
				}
				var result = validation.hasStringEntry(json["sap.package"], "i18n", 15, "i18n", "properties");
				if (!result) {
					//check for handlebars
					var s = JSON.stringify(json).match(/\{\{([^{}]*)\}\}/g);
					if (!s) return true;
					return false;
				}
				return true;
			}
		},
		"sap.package/i18n.3": {
			file: "/manifest.json",
			message: "Checking translation keys",
			error: "If translations are used an i18n entry is required",
			check: function (json) {
				if (packageValidators["sap.package/i18n.1"].result === "hint") {
					return "skipped";
				}
				delete json["sap.package"].contents;
				var jsonString = JSON.stringify(json);
				var aMatches = JSON.stringify(json).match(/\{\{([^{}]*)\}\}/g);
				if (validation.hasStringEntry(json["sap.package"], "i18n", 15, "i18n", "properties")) {
					try {
						var i18n = propertiesReader(path.join(packageDir, json["sap.package"].i18n));
						this.checklist = [],
							result = true,
							used = [];
						for (var i = 0; i < aMatches.length; i++) {
							var key = aMatches[i];
							key = key.substring(2, key.length - 2);
							if (i18n.get(key)) {
								used.push(key);
								this.checklist.push({ error: false, message: key + " found", key: key });
							} else {
								this.checklist.push({ error: true, message: key + " not found", key: key });
								result = false;
							}
						}
						var all = i18n.getAllProperties();
						for (var n in all) {
							if (used.indexOf(n) === -1) {
								//this.checklist.push({ error: "hint", message: n + " defined in i18n but never used", key: n });
							}
						}
						return result;
					} catch (ex) {
						this.error = "i18n file not found at " + path.join(packageDir, json["sap.package"].i18n);
						return false;
					}

				} else {
					this.message = this.message + " No translations needed"
					return true;
				}

				return true;
			}
		}

	}
	var status = {
		errors: 0,
		hints: 0,
		success: 0,
		skipped: 0

	}
	for (var n in packageValidators) {
		var validator = packageValidators[n],
			message = validator.message.substring(0, 77),
			spaces = new Array(80 - message.length).join("."),
			file
		try {
			if (file !== validator.file) {
				file = validator.file;
				util.log.normal("Validating..." + file);
				var content = files[file];
			}
			try {
				content = JSON.parse(JSON.stringify(content));
			} catch (ex) {
				content = files[file];
			}
			var result = validator.check && validator.check(content);
			validator.result = validator.result || result;
			if (result === "skipped") {
				util.log.gray(message + spaces + "Skipped");
				status.skipped++;
				continue;
			}
			if (result === true) {
				util.log.green(message + spaces + "Passed");
				status.success++;
			} else if (result === "hint") {
				util.log.yellow(message + spaces + "Passed - Warning");
				console.log(" - " + validator.hint);
				status.success++;
				status.hints++;
			} else {
				util.log.red(message + spaces + "Error");
				if (validator.hint) {
					util.log.yellow(validator.hint);
					status.hints++;
				}
				status.errors++;
				util.log.normal(" - " + validator.error);
			}
			if (validator.checklist) {
				for (var i = 0; i < validator.checklist.length; i++) {
					var res = validator.checklist[i];
					if (res.error === true) {
						status.errors++;
						util.log.red("    " + res.message + new Array(80 - 4 - res.message.length).join(".") + "Error");
					} else if (res.error === "hint") {
						status.hints++;
						util.log.yellow("    " + res.message + new Array(80 - 4 - res.message.length).join(".") + "Passed - Warning");
					} else {
						status.success++;
						util.log.green("    " + res.message + new Array(80 - 4 - res.message.length).join(".") + "Passed");
					}
				}
			}

		} catch (err) {
			util.log.red(validator.message + spaces + "... Error");
			util.log.red(validator.error);
			status.errors++;
			throw err;
		}
	}

	if (status.errors) {
		util.log.red("Finished with errors");
		util.log.red("Errors:" + status.errors + "  Success:" + status.success + "  Hints:" + status.hints + "  Skipped:" + status.skipped);
	} else if (status.hints) {
		util.log.normal("Finished with hints");
		util.log.normal("Errors:" + status.errors + "  Success:" + status.success + "  Hints:" + status.hints + "  Skipped:" + status.skipped);
	} else if (status.success) {
		util.log.normal("Finished with hints");
		util.log.normal("Errors:" + status.errors + "  Success:" + status.success + "  Hints:" + status.hints + "  Skipped:" + status.skipped);
	}
};