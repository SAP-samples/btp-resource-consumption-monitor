module.exports.build = function (dir) {
  const rimraf = require("rimraf"),
    util = require("../util/util.js"),
    path = require("path"),
    fs = require("fs-extra"),
    handlebars = require("handlebars"),
    propertiesReader = require("properties-reader"),
    businessHubBuild = process.argv.slice(2)[0] === "-b";

  // Load environment variables from .env file
  const dotenv = require("dotenv");
  const envPath = path.join(dir, util.relativeDir(dir), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log("Loaded environment variables from .env file");
  } else {
    console.log("Warning: No .env file found at " + envPath + ". Environment variables will not be replaced.");
  }

  // Function to replace ${VAR_NAME} placeholders with environment variables
  function replaceEnvVariables(obj) {
    if (typeof obj === "string") {
      return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        const value = process.env[varName];
        if (value === undefined) {
          console.log("Warning: Environment variable " + varName + " is not defined");
          return match;
        }
        return value;
      });
    }
    if (Array.isArray(obj)) {
      return obj.map(item => replaceEnvVariables(item));
    }
    if (obj !== null && typeof obj === "object") {
      const result = {};
      for (const key in obj) {
        result[key] = replaceEnvVariables(obj[key]);
      }
      return result;
    }
    return obj;
  }

  var validTypes = ["card", "workflow", "workspace-template", "workspace", "homepage", "workpage", "space", "role", "businessapp", "urltemplate", "catalog"];

  function getJSONPathValue(sPath, o) {
    var a = sPath.split("/");
    var oNode = o;
    for (var i = 0; i < a.length; i++) {
      if (!oNode || typeof oNode !== "object") break;
      oNode = oNode[a[i]];
    }
    return oNode ? oNode : "";
  }

  function createCDMBusinessAppForCard(cardManifest, i18nPath, predefinedVizId) {
    var cardId = cardManifest["sap.app"].id;
    var appId = `${cardId}.app`;
    var vizId = predefinedVizId || `${cardId}.viz`;
    var allKeys = util.i18n.allKeys(cardManifest);
    var result = {
      _version: "3.2.0",
      identification: {
        id: appId,
        title: cardManifest["sap.app"].title,
        entityType: "businessapp",
        // "description" to be deleted, only necessary because of bugs https://jira.tools.sap/browse/DWPBUGS-2514 and
        // https://jira.tools.sap/browse/DWPBUGS-2515
        description: "{{description}}"
      },
      payload: {
        visualizations: {
          [vizId]: {
            vizType: "sap.card",
            vizConfig: cardManifest,
            vizResources: {
              artifactId: cardId
            }
          }
        }
      }
    }

    result.texts = createCDMTextsFromI18N(i18nPath, allKeys, {
      locale: "",
      textDictionary: {
        description: "Business App Description"
      }
    });

    return result;
  }

  function createCDMTextsFromI18N(i18nPath, i18nKeys, fallbackObject) {
    try {
      i18nKeys = i18nKeys.filter(key => util.i18n.isKey(key))   // take real i18n refs only and ignore text literals
        .map(key => util.i18n.stripKey(key));  // strip off {{}}
      var files = util.readdir(i18nPath);
      var texts = files.map(file => {
        var entries = {};
        util.readfile(path.join(i18nPath, file))
          .split(/\r?\n/)
          .map(line => line.split("="))
          .filter(entry => i18nKeys.includes(entry[0]))
          .forEach(entry => entries[entry[0]] = entry[1]);
        return {
          locale: file.slice("i18n_".length, file.length - ".properties".length).replace(/_/gi, "-"),
          textDictionary: entries
        }
      });
      if (texts.length === 0) {
        texts.push(
          fallbackObject
        );
      }
      return texts;
    } catch (ex) {
      return [{
        locale: "",
        textDictionary: {
          description: "Business App Description"
        }
      }];
    }
  }

  function translateAndVersion(i18n, mapping, packageJSON, manifest) {
    if (i18n) {
      i18n = i18n.replace(".properties", "_en_US.properties");
      if (!fs.existsSync(i18n)) {
        i18n = i18n.replace("_en_US.properties", "_en.properties");
      }
      if (!fs.existsSync(i18n)) {
        i18n = i18n.replace("_en.properties", ".properties");
      }
      if (!fs.existsSync(i18n)) {
        console.log("No translation file found: " + sourceDir + manifest["sap.app"].i18n);
        return false;
      }
      var translations = propertiesReader(i18n),
        template = handlebars.compile(JSON.stringify(manifest)),
        data = translations.getAllProperties(),
        resultJSON = JSON.parse(template(data));
      for (var n in mapping) {
        packageJSON[mapping[n]] = getJSONPathValue(n, resultJSON);
      }
      return true;
    }
    console.log("Warning: manifest entries are not translated. -> " + sourceDir);
    return false;
  }

  //Create Artifact for API Hub
  function createArtifactBusinessHubJSON(sourceDir, targetBusinessHubTargetDir) {
    var mapping = {
      "sap.artifact/id": "Name",
      "sap.artifact/title": "Title",
      "sap.artifact/description": "ShortText",
      "sap.artifact/artifactVersion/version": "Version"
    }
    console.log("----" + sourceDir);
    var packageJSON = {},
      manifest = util.json.fromFile(path.join(sourceDir, "manifest.json")),
      i18n = path.join(sourceDir, manifest["sap.artifact"].i18n);
    if (translateAndVersion(i18n, mapping, packageJSON, manifest)) {
      util.json.toFile(path.join(targetBusinessHubTargetDir, "artifact.json"), packageJSON);
    } else {
      console.log("Info: Skipping Artifact for API Hub");
    }
  }

  //Create Package for API Hub
  function createPackageJSON(sourceDir, targetBusinessHubTargetDir) {
    var mapping = {
      "sap.package/id": "TechnicalName",
      "sap.package/title": "DisplayName",
      "sap.package/subTitle": "ShortText",
      "sap.package/description": "Description",
      "sap.package/packageVersion/version": "Version"
    }
    var packageJSON = {},
      manifest = util.json.fromFile(path.join(sourceDir, "manifest.json")),
      i18n = manifest["sap.package"].i18n;
    if (translateAndVersion(i18n, mapping, packageJSON, manifest)) {
      util.json.toFile(path.join(targetBusinessHubTargetDir, "artifact.json"), packageJSON);
    } else {
      console.log("Info: Skipping Package for API Hub");
    }
  }

  function mergeAppAndCardTranslation(firstArray, secondArray) {
    var mergedArray = [];

    var maxLength = Math.max(firstArray.length, secondArray.length);

    for (var i = 0; i < maxLength; i++) {
      var mergedItem = {};

      if (i < firstArray.length) {
        for (var key in firstArray[i]) {
          mergedItem[key] = firstArray[i][key];
        }
      }

      if (i < secondArray.length) {
        for (var key in secondArray[i]) {
          if (mergedItem[key] === undefined) {
            mergedItem[key] = secondArray[i][key];
          } else if (typeof mergedItem[key] === 'object' && typeof secondArray[i][key] === 'object') {
            mergedItem[key] = Object.assign({}, mergedItem[key], secondArray[i][key]);
          }
        }
      }

      mergedArray.push(mergedItem);
    }

    return mergedArray;
  }

  function buildContent(name, config) {
    util.log.fancy("Building artifact name: " + name + " type:" + config.type);
    if (config.type === "workpage" ||
      config.type === "role" ||
      config.type === "space" ||
      config.type === "businessapp" ||
      config.type === "catalog" ||
      config.type === "urltemplate") {
      var contentPath = path.join(root, config.src.from, config.src.content);
      var i18nPath = path.join(root, config.src.from, "i18n");
      var content = replaceEnvVariables(util.json.fromFile(contentPath));
      var app = appConfigs[name];
      if (config.type === "businessapp" && app.appConfig && app.cardConfig) {
        content.payload = content.payload || {};
        content.payload.visualizations = content.payload.visualizations || {};
        content.payload.visualizations[app.cardConfig.vizId] = {
          vizType: "sap.card",
          vizConfig: app.cardConfig.manifest,
          vizResources: {
            artifactId: app.cardConfig.manifest["sap.app"].id
          }
        };
        var appTranslation = createCDMTextsFromI18N(i18nPath, util.i18n.allKeys(content), {
          locale: "",
          textDictionary: {
            description: "Description"
          }
        });
        var cardTranslation = (function () {
          var sourceDir = path.dirname(app.cardConfig.manifestFilePath),
            i18nDir = path.join(sourceDir, "i18n");
          var cardConfig = createCDMBusinessAppForCard(app.cardConfig.manifest, i18nDir);
          return cardConfig.texts;
        })();
        content.texts = mergeAppAndCardTranslation(appTranslation, cardTranslation);
      } else {
        content.texts = createCDMTextsFromI18N(i18nPath, util.i18n.allKeys(content), {
          locale: "",
          textDictionary: {
            description: "Description"
          }
        });
      }
      aCDMEntities.push(content);
    } else {
      if (config.src.git || config.src.from) {
        /*
        contentDir = /Top/__contents
        baseDir = /Top/__contents/card-sample
        targetDir = /Top/package/artifacts/card-sample
         */
        var contentsDir = path.join(root, "__contents"),
          baseDir = path.join(contentsDir, name),
          targetDir = path.join(mainArtifactsPath, name),
          targetBusinessHubTargetDir = path.join(businessHubArtifactsPath, name);

        if (config.src.build) {
          // User specified build
          aRun = config.src.build.split(" && ")
          for (var i = 0; i < aRun.length; i++) {
            console.log("Run build in: " + path.join(baseDir, "build"));
            util.spawn.sync(aRun[i], path.join(baseDir, "build"), aRun[i] + " cannot be executed.\n");
          }
        } else {
          // Use Default Build
          var command = "node  " + path.join(__dirname, "artifactBuild.js") + " " + path.join(baseDir, "build") + " " + config.type.toLowerCase();
          console.log("Run build in: " + command);
          util.spawn.sync(command, path.join(baseDir, "build"), command + "node  cannot be executed.\n");
        }

        util.log.fancy("Copy artifact name: " + name + " type:" + config.type);
        //copy the result package
        //calcuate the zip file name
        var packageFileName;
        if (config.src.package) {
          packageFileName = path.join(config.src.package);
        } else {
          const artifactPackagejson = util.json.fromFile(path.join(baseDir, "build", "package.json"));
          packageFileName = artifactPackagejson.name + ".zip"
        }
        //packageSrcPath = /Top/__contents/card-sample/build/xxx.zip
        //packageTargetPath = /Top/package/artifacts/card-sample/xxx.zip
        var packageSrcPath = path.join(baseDir, "build", packageFileName),
          packageTargetPath = path.join(targetDir, "data.zip"),
          packageBusinessHubTargetTargetPath = path.join(targetBusinessHubTargetDir, "data.zip");
        if (!fs.existsSync(packageSrcPath)) {
          throw new Error("Error: " + packageSrcPath + " not found");
        }
        console.log("Package definition found: " + packageSrcPath);
        console.log("Copy package to target dir: " + packageTargetPath);
        fs.mkdirSync(targetDir);
        fs.copySync(packageSrcPath, packageTargetPath);
        if (businessHubBuild) {
          fs.copySync(packageSrcPath, packageBusinessHubTargetTargetPath);
        }
        //manifestPath = /Top/__contents/card-sample/build/src/manifest
        //manifestRoot = /Top/__contents/card-sample/build/src

        var manifestPath;
        if (config.src.manifest) {
          manifestPath = path.join(baseDir, "build", config.src.path, config.src.manifest);
        }
        if (!config.src.manifest || !fs.pathExistsSync(manifestPath)) {
          manifestPath = path.join(baseDir, "build", "src", "manifest.json")
        }

        var sourceDir = path.dirname(manifestPath),
          manifest = util.json.fromFile(manifestPath),
          i18nDir = path.join(sourceDir, "i18n"),
          artifactManifest,
          i18nFolder

        //creating artifact.json
        if (manifest["sap.app"] && manifest["sap.app"].type === "card") {

          if (!config.src.appId) {
            //create cdm content for card
            aCDMEntities.push(createCDMBusinessAppForCard(manifest, i18nDir, config.src.vizId));
          } else {
            console.log('appId is defined in card, but app not found. Hence, not processing card where key is "' + name + '".');
          }

          artifactManifest = {
            _version: "1.27.0",
            _generator: "cpkg-project-template"
          };
          console.log("Card found: Deriving sap.artifact section");

          //copy the sap.app section
          artifactManifest["sap.artifact"] = JSON.parse(JSON.stringify(manifest["sap.app"]));

          if (manifest["sap.app"].i18n) {
            if (typeof manifest["sap.app"].i18n === "string") {
              i18nFolder = path.join(sourceDir, path.dirname(manifest["sap.app"].i18n));
            }
            else if (typeof manifest["sap.app"].i18n === "object") {
              i18nFolder = path.join(sourceDir, path.dirname(manifest["sap.app"].i18n.bundleUrl));
            }

            //i18n is copied always in the i18n folder
            artifactManifest["sap.artifact"].i18n = "i18n/i18n.properties";
          }

          if (artifactManifest["sap.artifact"].applicationVersion) {
            artifactManifest["sap.artifact"].artifactVersion = artifactManifest["sap.artifact"].applicationVersion;
            delete artifactManifest["sap.artifact"].applicationVersion;
          } else {
            console.log("Error: Application version not found for Card " + manifestPath + "/" + manifest["sap.app"].id);
            throw new Error("sap.app/applicationVersion not defined in " + manifestPath + "/" + manifest["sap.app"].id);
          }
        } else {
          artifactManifest = {
            _version: "1.27.0",
            _generator: "cpkg-project-template",
            "sap.artifact": manifest["sap.artifact"]
          }
          if (manifest["sap.artifact"].i18n) {
            artifactManifest["sap.artifact"].i18n = "i18n/i18n.properties";
            // i18nFolder = /Top/__contents/card-sample/build/src/i18nfolder
            i18nFolder = path.join(sourceDir, path.dirname(manifest["sap.artifact"].i18n))
          }
        }

        console.log("Writing artifact manifest: " + targetDir + "/manifest.json");
        util.json.toFile(path.join(targetDir, "manifest.json"), artifactManifest);

        //copy i18n files
        console.log("Copy i18n folder " + i18nFolder);
        if (fs.pathExistsSync(i18nFolder)) {
          fs.copySync(i18nFolder, path.join(targetDir, "i18n"));
          console.log("Copy i18n folder: " + path.join(targetDir, "i18n"));
          //process the i18n
          util.i18n.process(path.join(targetDir, "manifest.json"));
        }

        console.log("Adding contents to /package/manifest.json");
        //adding contents manifest and baseDir
        aContentInfo.push({ manifest: artifactManifest, baseURL: "artifacts/" + name });

        if (businessHubBuild) {
          fs.mkdirSync(targetBusinessHubTargetDir);
          console.log("Generate artifact.json: " + targetDir + "/artifact.json");
          createArtifactBusinessHubJSON(targetDir, targetBusinessHubTargetDir);
        }
      }
    }
  }

  util.log.fancy("Start Build");

  /* 
    If running from Content Package scripts/xx.js, dir is /Top/scripts. 
    If running from BAS, dir will be the root folder like /Top
    root = /Top
    mainPackagePath = /Top/package
    mainArtifactsPath = /Top/package/artifacts
    businessHubPath = /Top/businesshub
    businessHubArtifactsPath = /Top/businesshub/Artifacts
  */
  var root = path.join(dir, util.relativeDir(dir)),
    mainPackagePath = path.join(root, "package"),
    mainArtifactsPath = path.join(root, "package", "artifacts"),
    businessHubPath = path.join(root, "businesshub"),
    businessHubArtifactsPath = path.join(root, "businesshub", "Artifacts");


  console.log("Clear previous results...")
  rimraf.sync(mainPackagePath);
  rimraf.sync(businessHubPath);
  rimraf.sync(path.join(root, "package.zip"));
  rimraf.sync(path.join(root, "businesshub.zip"));
  console.log("Done");

  console.log("Create folders...")
  fs.mkdirSync(mainPackagePath);
  fs.mkdirSync(mainArtifactsPath);
  if (businessHubBuild) {
    fs.mkdirSync(businessHubPath);
    fs.mkdirSync(businessHubArtifactsPath);
  }
  console.log("Done");

  //creating content artifacts and collect info
  //contentConfig is /Top/content.json
  var contentConfig = util.json.fromFile(path.join(root, "content.json"));
  if (Object.keys(contentConfig).length === 0) {
    console.log("Error: content.json does not contain any entries.");
    throw new Error("Error: content.json does not contain any entries.");
  }

  var aContentInfo = [],
    aCDMEntities = [],
    appConfigs = {};

  for (var n in contentConfig) {
    var type = contentConfig[n].type;
    if (type === "businessapp") {
      var src = contentConfig[n].src;
      var appConfigFilePath = path.join(root, src.from, src.content);
      var appConfigFileContent = util.json.fromFile(appConfigFilePath);
      var appConfigId = appConfigFileContent.identification && appConfigFileContent.identification.id;

      appConfigs[n] = {
        appConfig: {
          manifest: appConfigFileContent,
          appId: appConfigId
        }
      }
    }
  }

  for (var n in contentConfig) {
    var type = contentConfig[n].type;
    if (type === "card") {
      var src = contentConfig[n].src;
      var appId = src.appId;

      // card type with appId
      if (appId) {
        for (var appKeyName in appConfigs) {
          if (appConfigs.hasOwnProperty(appKeyName)) {
            if (appConfigs[appKeyName].appConfig.appId === appId) {
              var cardManifestFilePath = path.join(root, contentConfig[n].src.from, contentConfig[n].src.manifest);
              var cardManifestFileContent = util.json.fromFile(cardManifestFilePath);
              var fallbackVizId = cardManifestFileContent["sap.app"].id + ".viz";
              var vizId = src.vizId || fallbackVizId;
              appConfigs[appKeyName].cardConfig = {
                manifest: cardManifestFileContent,
                manifestFilePath: cardManifestFilePath,
                vizId: vizId,
                cardKey: n
              };
            }
          }
        }
      }
    }
  }

  for (var n in contentConfig) {
    var type = contentConfig[n].type;
    contentConfig[n].src.path = contentConfig[n].src.path || "./";
    contentConfig[n].src.build = contentConfig[n].src.build || "";
    if (validTypes.indexOf(type) === -1) {
      throw new Error("Unknown artifact type " + type + ". Should be " + validTypes.join(","));
    } else {
      buildContent(n, contentConfig[n]);
    }

  }

  //add the contentInfo to main manifest
  //main is Top/manifest.json
  var man = util.json.fromFile(path.join(root, "manifest.json")),
    pack = getJSONPathValue("sap.package", man);


  pack.contents = aContentInfo;

  //add cdm entities
  pack.cdmEntities = [
    ...aCDMEntities
  ];

  console.log("Save /package/manifest.json");
  util.json.toFile(path.join(mainPackagePath, "manifest.json"), man);


  if (fs.pathExistsSync(path.join(root, "i18n"))) {
    console.log("Copy i18n folder");
    fs.copySync(path.join(root, "i18n"), path.join(mainPackagePath, "i18n"));
    //process the i18n
    util.i18n.process(path.join(mainPackagePath, "manifest.json"));
  }

  util.json.toFile(path.join(mainPackagePath, "manifest.json"), man);

  console.log("Creating package.zip ");
  util.zip.folder(path.join(root, "package.zip"), path.join(root, "package"));

  if (businessHubBuild) {
    createPackageJSON(root, businessHubPath);
    util.log.fancy("Creating businesshub.zip");
    util.zip.folder(path.join(root, "businesshub.zip"), path.join(root, "businesshub"));
    rimraf.sync(path.join(root, "businesshub"));
  }
  util.log.fancy("Build finished successful.");

};
