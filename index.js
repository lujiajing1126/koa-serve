'use strict';

var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    send = require('koa-send'),
    debug = require('debug')('koa-serve'),
    assert = require('assert');

module.exports = exports = function (directories, root) {
    assert(directories,"Directory argument not specified");
    if (!_.isArray(directories)) directories = [directories];
    root = root || path.join(__dirname, '..', '..');
    root = path.normalize(root);

    return function *(next) {
        var reqPath = this.path,
            filePath, isAsset, fd;

        isAsset = _.any(directories, function (dir) {
            return _.startsWith(reqPath, '/' + dir);
        });

        if (!isAsset) return yield next;

        debug('requested:', reqPath);
        try {
            var isDir = fs.lstatSync(root + this.path).isDirectory();
            filePath = (isAsset && !isDir)
                ? root + this.path
                : path.join(root,this.path,'index.html');
            if(isAsset && isDir && this.path !== '/' && !/\/$/.test(this.path))
                this.redirect(root + this.path + '/');
            debug('served:', filePath);
            yield send(this, filePath);
        }
        catch (e) {
            debug(e);
            if (isAsset) {
                this.body = 'Not Found';
                this.status = 404;
            } else {
                yield next;
            }
        }
    }
};
