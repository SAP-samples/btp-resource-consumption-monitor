const contentpackagebuild = require("./content-package/build.js")
const contentpackagepull = require("./content-package/pull.js")
const contentpackagevalidate = require("./content-package/validate.js")
const cardbuild = require("./card/build.js")

module.exports = {
  "contentpackage": {
    build: contentpackagebuild.build,
    pull: contentpackagepull.pull,
    validate: contentpackagevalidate.validate
  },
  "card": {
    build: cardbuild.build
  }
}