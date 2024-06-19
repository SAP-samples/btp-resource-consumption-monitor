module.exports.build = function (dir) {
  const path = require("path"),
    util = require("../util/util.js"),
    rimraf = require("rimraf"),
    fs = require("fs-extra"),
    root = path.join(dir, util.relativeDir(dir)),
    packagejson = util.json.fromFile(path.join(root, "package.json")),
    name = packagejson.name,
    ui5BuildParams = packagejson.ui5 && packagejson.ui5.buildParams ? packagejson.ui5.buildParams : "",
    dist = path.join(root, "dist"),
    out = path.join(root, name + ".zip");

  util.log.fancy("Building Card Package: " + dir + "/src");
  console.log(" - Clean files and folders");

  rimraf.sync(dist);

  fs.removeSync(out);

  //if ui5 cli does not exist, install it.
  var ret = util.spawn.Advancedsync("which ui5", root, process.env);
  if (ret.status) {
    var ui5path = path.join(__dirname, "..", "..", "..", "node_modules", ".bin", "ui5");
    console.log(ui5path);
    if (!fs.existsSync(ui5path)) {
      console.log("install @ui5/cli");
      util.spawn.sync("npm install @ui5/cli@3.3.1", path.join(__dirname, "..", "..", ".."), "fail to install ui5");
    }
    if (fs.existsSync(ui5path)) {
      process.env.PATH += ":" + path.dirname(ui5path);
    }
  }

  console.log(" - Create dist folder and content");

  if (!fs.existsSync(path.join(root, 'node_modules'))) {
    console.log("Do npm install first");
    util.spawn.sync("npm install", root, "fail to do npm install");
  }

  console.log(" - Run UI5 build: " + "ui5 build " + ui5BuildParams);
  util.spawn.sync("ui5 build " + ui5BuildParams, root, "UI5 build failed");

  util.i18n.process(path.join(dist, "manifest.json"));

  console.log(" - Zip content to " + name + ".zip");

  util.zip.folder(out, root, "dist");

  util.log.fancy("Building Card Package finished successful");
}