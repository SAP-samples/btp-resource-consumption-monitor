module.exports.pull = function (dir, local) {//load content.json
  /* 
    If running from Content Package scripts/xx.js, dir is /Top/scripts. 
    If running from BAS, dir will be the root folder like /Top
    contentConfig will be /Top/content.json
    contentDir will be /Top/__contents
  */
  const rimraf = require("rimraf"),
    path = require("path"),
    util = require("../util/util.js"),
    fs = require("fs-extra"),
    contentConfig = util.json.fromFile(path.join(dir, util.relativeDir(dir), "content.json")),
    cdmTypes = ["workpage", "space", "role", "businessapp", "urltemplate", "catalog"],
    contentsDir = path.join(dir, util.relativeDir(dir), "__contents");

  util.log.fancy("Starting Pull");

  try {
    console.log("Clean __contents dir");
    rimraf.sync(contentsDir);

    fs.mkdirSync(contentsDir);

    //loop entries and pull from git
    for (var n in contentConfig) {
      pullContent(n, contentConfig[n])
    }
    util.log.fancy("Pull finished successful");
  } catch (ex) {
    util.log.fancy("Error:" + ex.message);
  }

  function pullContent(name, config) {
    /*
      "card-sample": {
        "type": "card",
        "src": {
          "from": "../mycard",
          "path": "./",
          "build": "",
        }
      }
      name: is card-sample which defined in content.js, config the below one
    */
    console.log("Start pulling content for Artifact: " + name);
    if (config.src && cdmTypes.indexOf(config.type.toLowerCase()) === -1) {
      config.src.path = contentConfig[n].src.path || "";
      config.src.build = contentConfig[n].src.build || "";
      //baseDir will be /Top/__contents/card-sample
      var baseDir = path.join(contentsDir, name);
      console.log("Create Base Directory :" + baseDir);
      fs.mkdirSync(baseDir);
      var fromDir;
      if (config.src.git) {
        util.log.fancy("Pull content for " + n + ": " + (config.src.git || config.src.from) + (config.src.git && config.src.branch ? " on branch/label " + config.src.branch || "master" : ""));
        var projectDir = config.src.git.substring(config.src.git.lastIndexOf("/") + 1, config.src.git.length - 4);
        if (!config.src.branch) {
          console.log("Warning: 'config.src.branch' not set. Using 'master', consider to specify for delivery.");
          config.src.branch = "master";
        }
        console.log("Cloning..." + config.src.git + " on branch:" + config.src.branch);
        // git clone to baseDir： /Top/__contents/card-sample, will have a folder mycards, projectDir = mycards
        util.spawn.sync("git clone -b " + config.src.branch + " --depth 1 " + config.src.git, baseDir, "Cannot sync from git " + config.src.git);
        // fromDir is the /Top/__contents/mycards/subfolder
        fromDir = path.join(baseDir, projectDir, config.src.path);
      } else if (config.src.from) {
        console.log("[User config] Artifact From: " + config.src.from);
        console.log("[User config] Artifact Path: " + config.src.path);
        // config.src.from is the folder user specified, like "../mycard" dirname is folder name: mycard    
        // fromDir is the user's specified folder like "/home/user/cpproject/mycard"
        var fromDir;
        if (config.src.from.startsWith("/")) {
          fromDir = config.src.from.split("/");
          fromDir = ["/"].concat(fromDir);
          fromDir = path.join.apply(path, fromDir);
        } else {
          fromDir = config.src.from.split("/");
          fromDir = [dir, util.relativeDir(dir)].concat(fromDir);
          fromDir = path.join.apply(path, fromDir);
        }
        fromDir = path.join(fromDir, config.src.path);
      }
      // Only Non cdmTypes need to copy to build

      console.log("From Folder: " + fromDir);
      // If the artifact already have the package.json which means it has build script
      if (config.src.build || fs.existsSync(path.join(fromDir, "package.json"))) {
        console.log("Copy From Folder to: " + path.join(baseDir, "build"));
        fs.copySync(fromDir, path.join(baseDir, "build"));
      } else {
        console.log("Artifact don't have build script, will use default one");
        // Copy the from folder /home/user/cpproject/mycard to Target Folder "/Top/__contents/card-sample/build/src"
        console.log("Copy From Folder to: " + path.join(baseDir, "build", "src"));
        fs.copySync(fromDir, path.join(baseDir, "build", "src"));

        if (config.type.toLowerCase() === "card") {
          // Find out /Top/__contents/card-sample/build/src/manifest.json
          const artifactManifestjson = util.json.fromFile(path.join(baseDir, "build", 'src', 'manifest.json'));
          const cardName = artifactManifestjson["sap.app"].id.replace(/\./g, "-");
          // Add package.json
          console.log("Write file: " + path.join(baseDir, "build", "package.json"));
          let tmpText = fs.readFileSync(path.join(__dirname, "../resources/card-package.json.template"), 'utf-8').replace("{{CardName}}", cardName);
          fs.writeFileSync(path.join(baseDir, "build", "package.json"), tmpText);
          // Add ui5.yaml
          console.log("Write file: " + path.join(baseDir, "build", "ui5.yaml"));
          tmpText = fs.readFileSync(path.join(__dirname, "../resources/card-ui5.yaml.template"), 'utf-8').replace("{{CardName}}", cardName);
          fs.writeFileSync(path.join(baseDir, "build", "ui5.yaml"), tmpText);

          rimraf.sync(path.join(baseDir, "build", "src", ".card"));
          rimraf.sync(path.join(baseDir, "build", "src", ".wst"));
          rimraf.sync(path.join(baseDir, "build", "src", "ui5.yaml"));
          rimraf.sync(path.join(baseDir, "build", "src", "package.json"));

        } else {
          // Find out /Top/__contents/card-sample/build/src/manifest.json
          const artifactManifestjson = util.json.fromFile(path.join(baseDir, "build", 'src', 'manifest.json'));
          const artifactName = artifactManifestjson["sap.artifact"].id.replace(/\./g, "-");
          // Add package.json
          console.log("Write file: " + path.join(baseDir, "build", "package.json"));
          let tmpText = fs.readFileSync(path.join(__dirname, "../resources/package.json.template"), 'utf-8').replace("{{ArtifactName}}", artifactName);
          fs.writeFileSync(path.join(baseDir, "build", "package.json"), tmpText);
        }
      }

      if (local) {
        // if use local tools
        console.log("Use local tools for " + path.join(baseDir, "build", config.src.path, "scripts", "build.js"));
        // Open /Top/__contents/card-sample/build/script/build.js
        var build = fs.readFileSync(path.join(baseDir, "build", config.src.path, "scripts", "build.js"), { encoding: "utf-8" });
        // replace "require("sap-workzone-cpkg-tools")" to "require("/../../tools/index.js")"
        build = build.replace("sap-workzone-cpkg-tools", __dirname + "/../../tools/index.js");
        fs.writeFileSync(path.join(baseDir, "build", config.src.path, "scripts", "build.js"), build);
      }
      console.log("Completed pulling content for Artificat: " + name + "\n");
    } else {
      util.log.fancy("Error: No src config for " + n);
    }
  }
};
