const fs = require("fs-extra"),
	path = require("path"),
	{ spawnSync } = require('child_process');

var util = {
	spawn: {
		sync: function (command, folder, message) {
			var spawn = spawnSync(command, { cwd: folder, shell: true, stdio: "inherit" });
			console.log("status");
			if (spawn.status) {
				throw new Error(message);
			}
		},
		Advancedsync: function (command, folder, oEnv) {
			var spawn = spawnSync(command, { cwd: folder, shell: true, stdio: "inherit", env: oEnv });
			return spawn;
		}
	},
	zip: {
		folder: function (targetfile, sourcefolder, folder = "*") {
			util.spawn.sync("npx bestzip " + targetfile + " " + folder, sourcefolder);
		}
	},
	readdir: function (path) {
		var files;
		try {
			files = fs.readdirSync(path);
		} catch (err) {
			console.log("Error reading directory" + path);
			throw err;
		}
		return files;
	},
	relativeDir: function (dir) {
		return path.basename(dir).toLowerCase() === 'scripts' ? ".." : "."
	},
	readfile: function (filename) {
		var file;
		try {
			file = fs.readFileSync(filename, "utf-8");
		} catch (err) {
			console.log("Error reading " + filename);
			throw err;
		}
		return file;
	},
	json: {
		fromFile: function (filename) {
			var s;
			try {
				s = fs.readFileSync(filename, "utf-8");
			} catch (err) {
				console.log("Error reading " + filename);
				throw err;
			}
			try {
				return JSON.parse(s);
			} catch (err) {
				console.log("Error parsing " + filename + ". Not a valid JSON.");
				throw err;
			}
		},
		toFile: function (filename, json, formatted = true) {
			var s;
			try {
				s = JSON.stringify(json, null, formatted ? "\t" : null);
			} catch (err) {
				console.log("Error json not a valid object.");
				throw err;
			}
			fs.writeFileSync(filename, s);
		}
	},
	log: {
		fancy: function (s) {
			console.log("\n" + (new Array(s.length + 1)).join("-"));
			console.log(s);
		},
		normal: function (s) {
			console.log("\x1b[39m" + s + "\x1b[39m");
		},
		green: function (s) {
			console.log("\x1b[32m" + s + "\x1b[39m");
		},
		red: function (s) {
			console.log("\x1b[31m" + s + "\x1b[39m");
		},
		blue: function (s) {
			console.log("\x1b[34m" + s + "\x1b[39m");
		},
		yellow: function (s) {
			console.log("\x1b[33m" + s + "\x1b[39m");
		},
		gray: function (s) {
			console.log("\x1b[37m" + s + "\x1b[39m");
		}

	},
	i18n: {
		isKey: function (key) {
			return key.match(/{{[^{}]+}}/);
		},
		stripKey: function (key) {
			return key.slice(2, key.length - 2);
		},
		allKeys: function (obj) {
			const str = JSON.stringify(obj);
			const keys = str.match(/{{[^{}]+}}/g);
			return [...new Set(keys)];  // remove duplicates
		},
		create: function (dir, basename, settings) {
			if (!settings || !settings.from || !settings.to) {
				console.log("i18n: cannot create i18n file. No from/to languages given");
				return;
			}
			var fromFile;
			if (settings.from === "") {
				fromFile = basename.replace(".properties", settings.from + ".properties")
			} else {
				fromFile = basename.replace(".properties", "_" + settings.from + ".properties");
			}
			var fromPath = path.join(dir, fromFile);

			if (!fs.existsSync(fromPath)) {
				console.log("i18n: create from " + fromFile + ", skipping");
				return;
			}
			if (!Array.isArray(settings.to)) {
				settings.to = [settings.to];
			}
			for (var i = 0; i < settings.to.length; i++) {
				var toFile;
				if (settings.to[i] === "") {
					toFile = basename.replace(".properties", settings.to[i] + ".properties")
				} else {
					toFile = basename.replace(".properties", "_" + settings.to[i] + ".properties");
				}
				var toPath = path.join(dir, toFile);
				if (fs.existsSync(toPath)) {
					console.log("i18n: file exists already " + toFile + ", skipping");
					continue;
				} else {
					fs.copyFileSync(fromPath, toPath);
					console.log("i18n: file created " + toFile + " from " + fromFile);
				}
			}

		},
		process: function (manifestpath, i18npath) {
			var manifest = util.json.fromFile(manifestpath),
				root = i18npath || path.dirname(manifestpath),
				i18nsettings
			if (manifest["sap.app"]) {
				i18nsettings = manifest["sap.app"] && manifest["sap.app"].i18n;
			} else if (manifest["sap.package"]) {
				i18nsettings = manifest["sap.package"] && manifest["sap.package"].i18n;
			} else if (manifest["sap.artifact"]) {
				i18nsettings = manifest["sap.artifact"] && manifest["sap.artifact"].i18n;
			} else {
				console.log("Warning: No sap.app, sap.package, sap.artifact i18n setting found. Are you processing the right file");
				return;
			}

			if (i18nsettings && typeof i18nsettings === "string") {
				console.log(" - Checking i18n settings - pointing to " + i18nsettings);
				var paths = i18nsettings.split("/"),
					basefilename = paths.pop();
				paths = [root].concat(paths);
				var i18n = path.join.apply(path, paths);
				if (fs.pathExistsSync(i18n)) {
					util.i18n.create(i18n, basefilename, { from: "en_US", to: ["en", ""] });
					util.i18n.create(i18n, basefilename, { from: "es_ES", to: "es" });
					util.i18n.create(i18n, basefilename, { from: "fr_FR", to: "fr" });
					util.i18n.create(i18n, basefilename, { from: "de_DE", to: "de" });
					util.i18n.create(i18n, basefilename, { from: "pt_PT", to: "pt" });
					util.i18n.create(i18n, basefilename, { from: "en", to: "en_US" });
					util.i18n.create(i18n, basefilename, { from: "en", to: "en_GB" });
					util.i18n.create(i18n, basefilename, { from: "es", to: "es_ES" });
					util.i18n.create(i18n, basefilename, { from: "es_ES", to: "es_MX" });
					util.i18n.create(i18n, basefilename, { from: "fr", to: "fr_FR" });
					util.i18n.create(i18n, basefilename, { from: "fr_FR", to: "fr_CA" });
					util.i18n.create(i18n, basefilename, { from: "de", to: "de_DE" });
					util.i18n.create(i18n, basefilename, { from: "de_DE", to: "de_CH" });
					util.i18n.create(i18n, basefilename, { from: "pt", to: "pt_PT" });
					util.i18n.create(i18n, basefilename, { from: "pt_PT", to: "pt_BR" });
				} else {
					console.log("Folder with file " + i18nsettings + " does not exist. Remove i18n setting or create a folder containing at least a file " + i18nsettings + " or " + i18nsettings.replace(".properties", "_en_US.properties"));
					throw new Error("Folder with file " + i18nsettings + " does not exist. Remove i18n setting or create a folder containing at least a file " + i18nsettings + " or " + i18nsettings.replace(".properties", "_en_US.properties"));
				}
			} else {
				console.log(" - Checking i18n settings - No translations");
			}
		}
	}
};
module.exports = util;
