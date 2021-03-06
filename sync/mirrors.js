/**!
 * mirrors - sync/mirrors.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mirrors:sync:mirrors');
var util = require('util');
var urllib = require('urllib');
var Syncer = require('./syncer');

module.exports = MirrorsSyncer;

function MirrorsSyncer(options) {
  if (!(this instanceof MirrorsSyncer)) {
    return new MirrorsSyncer(options);
  }
  this._alwayNewDirIndex = options.alwayNewDirIndex;
  Syncer.call(this, options);
}

util.inherits(MirrorsSyncer, Syncer);

var proto = MirrorsSyncer.prototype;

proto.check = function (checksums, info) {
  if (!info.size) {
    return true;
  }
  return checksums.size === info.size;
};

proto.listdir = function* (fullname, dirIndex) {
  var alwayNewDir = false;
  if (typeof this._alwayNewDirIndex === 'number' && this._alwayNewDirIndex === dirIndex) {
    alwayNewDir = true;
  }
  var url = this.disturl + fullname;

  var res = yield urllib.requestThunk(url, {
    timeout: 60000,
    dataType: 'json'
  });
  debug('listdir %s got %s, %j', url, res.status, res.headers);
  if (res.status !== 200) {
    var msg = util.format('request %s error, got %s', url, res.status);
    throw new Error(msg);
  }

  return res.data.map(function (file) {
    var item = {
      isNew: null,
      name: file.name,
      size: file.size || '-',
      date: file.date,
      type: file.type === 'file' ? 'file' : 'dir',
      parent: fullname,
      downloadURL: file.url
    };
    if (item.type === 'dir' && alwayNewDir) {
      item.isNew = true;
    }
    return item;
  });
};
