(function (window) {

    // expose colorLib
    var colorLib = {},
        freeExports = typeof exports === 'object' && exports,
        freeModule = typeof module === 'object' && module && module.exports === freeExports && module;

    // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
    // Expose colorLib to the global object even when an AMD loader is present in
    // case colorLib was injected by a third-party script and not intended to be
    // loaded as a module. The global assignment can be reverted in the colorLib
    // module via its `noConflict()` method.
    window.colorLib = colorLib;

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "colorLib" module
    define(function() {
      return colorLib;
    });
    }
    // check for `exports` after `define` in case a build optimizer adds an `exports` object
    else if (freeExports && !freeExports.nodeType) {
    // in Node.js or RingoJS v0.8.0+
    if (freeModule) {
      (freeModule.exports = colorLib).colorLib = colorLib;
    }
    // in Narwhal or RingoJS v0.7.0-
    else {
      freeExports.colorLib = colorLib;
    }
    }
    else {
    // in a browser or Rhino
    window.colorLib = colorLib;
    }