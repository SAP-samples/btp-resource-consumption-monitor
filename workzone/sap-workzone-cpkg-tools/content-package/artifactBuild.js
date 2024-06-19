const process = require('process');
try {
    let args = process.argv;
    let projPath = args[2];
    let artifactType = args[3];
    var build = require("../" + artifactType + "/build.js");
    build.build(projPath);
} catch (err) {
    console.error(err.message);
}
