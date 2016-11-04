'use strict';

var Plugin = require('broccoli-plugin');
var Path = require('path');
var FS = require('fs');
var Funnel = require('broccoli-funnel');
var mkdirp = require('mkdirp');
var mergeTrees = require('broccoli-merge-trees');

// Create a subclass ModifyAndMergeFiles derived from Plugin
ModifyAndMergeFiles.prototype = Object.create(Plugin.prototype);
ModifyAndMergeFiles.prototype.constructor = ModifyAndMergeFiles;
function ModifyAndMergeFiles(inputNode, options) {
  if (!(this instanceof ModifyAndMergeFiles)) { return new ModifyAndMergeFiles(inputNode, options); }
  if (!options || !options.modify) { throw new Error('No `modify` function given'); }
  if (!options || !options.outputFile) { throw new Error('No `outputFile` given'); }

  inputNode = Funnel(inputNode, options);

  Plugin.call(this, [inputNode], options);

  this.options = options;
}

ModifyAndMergeFiles.prototype.build = function() {
  var inputPath = this.inputPaths[0];
  var fullOutputPath = Path.join(this.outputPath, this.options.outputFile);
  var targetDir = Path.dirname(fullOutputPath);

  var fileList = FS.readdirSync(inputPath);
  var files = fileList.map(function(fileName) {
    return FS.readFileSync(Path.join(inputPath, fileName));
  });

  // Convert files
  var outputFile = this.options.modify(files);

  if (!FS.existsSync(targetDir)) {
    mkdirp.sync(targetDir);
  }

  FS.writeFileSync(fullOutputPath, outputFile);
};

module.exports = {
  name: 'ember-cli-modify-and-merge-files',

  treeForApp: function() {
    var modifyFiles = (this.app && this.app.options && this.app.options.modifyFiles) || [];

    var trees = modifyFiles.map(function(file) {
      return ModifyAndMergeFiles(this.app.trees.app, file);
    });

    return mergeTrees(trees)
  }
};
