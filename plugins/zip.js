/* eslint import/no-extraneous-dependencies: ["error", { devDependencies: true }] */

const fs = require('fs')
const archiver = require('archiver')

module.exports = class WebpackZipPlugin {
  constructor(options) {
    this.options = options || {}
  }

  apply(compiler) {
    compiler.plugin('after-emit', (compilation, cb) => {
      const output = fs.createWriteStream(this.options.path)
      const archive = archiver('zip')

      archive.pipe(output)
      archive.directory(compilation.options.output.path, false)
      archive.finalize()
      cb()
    })
  }
}
