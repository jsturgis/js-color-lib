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

function number(n) {
    if (n instanceof colorLib.Dimension) {
        return parseFloat(n.unit.is('%') ? n.value / 100 : n.value);
    } else if (typeof(n) === 'number') {
        return n;
    } else {
        throw {
            error: "RuntimeError",
            message: "color functions take numbers as parameters"
        };
    }
}

colorLib.functions = {
    rgb: function (r, g, b) {
        return this.rgba(r, g, b, 1.0);
    },
    rgba: function (r, g, b, a) {
        var rgb = [r, g, b].map(function (c) { return scaled(c, 256); });
        a = number(a);
        return new(colorLib.Color)(rgb, a);
    },
    hslToRgb: function (h, s, l) {
        return this.hsla(h, s, l, 1.0);
    },
    hsl: function (h, s, l) {
        return this.hsla(h, s, l, 1.0);
    },
    hsla: function (h, s, l, a) {
        h = (number(h) % 360) / 360;
        s = clamp(number(s)); l = clamp(number(l)); a = clamp(number(a));

        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if (h * 6 < 1){
                return m1 + (m2 - m1) * h * 6;
            } else if (h * 2 < 1){
                return m2;
            } else if (h * 3 < 2) {
                return m1 + (m2 - m1) * (2/3 - h) * 6;
            } else {
                return m1;
            }
        }

        return this.rgba(hue(h + 1/3) * 255,
                         hue(h)       * 255,
                         hue(h - 1/3) * 255,
                         a);

    },

    hsvToRgb: function(h, s, v) {
        return this.hsva(h, s, v, 1.0);
    },

    hsv: function(h, s, v) {
        return this.hsva(h, s, v, 1.0);
    },

    hsva: function(h, s, v, a) {
        h = ((number(h) % 360) / 360) * 360;
        s = number(s); v = number(v); a = number(a);

        var i, f;
        i = Math.floor((h / 60) % 6);
        f = (h / 60) - i;

        var vs = [v,
                  v * (1 - s),
                  v * (1 - f * s),
                  v * (1 - (1 - f) * s)];
        var perm = [[0, 3, 1],
                    [2, 0, 1],
                    [1, 0, 3],
                    [1, 2, 0],
                    [3, 1, 0],
                    [0, 1, 2]];

        return this.rgba(vs[perm[i][0]] * 255,
                         vs[perm[i][1]] * 255,
                         vs[perm[i][2]] * 255,
                         a);
    },

    hue: function (color) {
        return new (colorLib.Dimension)(Math.round(color.toHSL().h));
    },
    saturation: function (color) {
        return new (colorLib.Dimension)(Math.round(color.toHSL().s * 100), '%');
    },
    lightness: function (color) {
        return new (colorLib.Dimension)(Math.round(color.toHSL().l * 100), '%');
    },
    hsvhue: function(color) {
        return new (colorLib.Dimension)(Math.round(color.toHSV().h));
    },
    hsvsaturation: function (color) {
        return new (colorLib.Dimension)(Math.round(color.toHSV().s * 100), '%');
    },
    hsvvalue: function (color) {
        return new (colorLib.Dimension)(Math.round(color.toHSV().v * 100), '%');
    },
    red: function (color) {
        return new (colorLib.Dimension)(color.rgb[0]);
    },
    green: function (color) {
        return new (colorLib.Dimension)(color.rgb[1]);
    },
    blue: function (color) {
        return new (colorLib.Dimension)(color.rgb[2]);
    },
    alpha: function (color) {
        return new (colorLib.Dimension)(color.toHSL().a);
    },
    luma: function (color) {
        return new (colorLib.Dimension)(Math.round(color.luma() * color.alpha * 100), '%');
    },
    saturate: function (color, amount) {
        var hsl = color.toHSL();

        hsl.s += amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    desaturate: function (color, amount) {
        var hsl = color.toHSL();

        hsl.s -= amount.value / 100;
        hsl.s = clamp(hsl.s);
        return hsla(hsl);
    },
    lighten: function (color, amount) {
        var hsl = color.toHSL();

        hsl.l += amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    darken: function (color, amount) {
        var hsl = color.toHSL();

        hsl.l -= amount.value / 100;
        hsl.l = clamp(hsl.l);
        return hsla(hsl);
    },
    fadein: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a += amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fadeout: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a -= amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    fade: function (color, amount) {
        var hsl = color.toHSL();

        hsl.a = amount.value / 100;
        hsl.a = clamp(hsl.a);
        return hsla(hsl);
    },
    spin: function (color, amount) {
        var hsl = color.toHSL();
        var hue = (hsl.h + amount.value) % 360;

        hsl.h = hue < 0 ? 360 + hue : hue;

        return hsla(hsl);
    },
    //
    // Copyright (c) 2006-2009 Hampton Catlin, Nathan Weizenbaum, and Chris Eppstein
    // http://sass-lang.com
    //
    mix: function (color1, color2, weight) {
        if (!weight) {
            weight = new (colorLib.Dimension)(50);
        }
        var p = weight.value / 100.0;
        var w = p * 2 - 1;
        var a = color1.toHSL().a - color2.toHSL().a;

        var w1 = (((w * a === -1) ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
        var w2 = 1 - w1;

        var rgb = [color1.rgb[0] * w1 + color2.rgb[0] * w2,
                   color1.rgb[1] * w1 + color2.rgb[1] * w2,
                   color1.rgb[2] * w1 + color2.rgb[2] * w2];

        var alpha = color1.alpha * p + color2.alpha * (1 - p);

        return new (colorLib.Color)(rgb, alpha);
    },
    greyscale: function (color) {
        return this.desaturate(color, new (colorLib.Dimension)(100));
    },
    contrast: function (color, dark, light, threshold) {
        // filter: contrast(3.2);
        // should be kept as is, so check for color
        if (!color.rgb) {
            return null;
        }
        if (typeof light === 'undefined') {
            light = this.rgba(255, 255, 255, 1.0);
        }
        if (typeof dark === 'undefined') {
            dark = this.rgba(0, 0, 0, 1.0);
        }
        //Figure out which is actually light and dark!
        if (dark.luma() > light.luma()) {
            var t = light;
            light = dark;
            dark = t;
        }
        if (typeof threshold === 'undefined') {
            threshold = 0.43;
        } else {
            threshold = number(threshold);
        }
        if ((color.luma() * color.alpha) < threshold) {
            return light;
        } else {
            return dark;
        }
    },
    e: function (str) {
        return new (colorLib.Anonymous)(str instanceof colorLib.JavaScript ? str.evaluated : str);
    },
    escape: function (str) {
        return new (colorLib.Anonymous)(encodeURI(str.value).replace(/=/g, "%3D").replace(/:/g, "%3A").replace(/#/g, "%23").replace(/;/g, "%3B").replace(/\(/g, "%28").replace(/\)/g, "%29"));
    },
    '%': function (quoted /* arg, arg, ...*/) {
        var args = Array.prototype.slice.call(arguments, 1),
            str = quoted.value;

        for (var i = 0; i < args.length; i++) {
            str = str.replace(/%[sda]/i, function(token) {
                var value = token.match(/s/i) ? args[i].value : args[i].toCSS();
                return token.match(/[A-Z]$/) ? encodeURIComponent(value) : value;
            });
        }
        str = str.replace(/%%/g, '%');
        return new (colorLib.Quoted)('"' + str + '"', str);
    },
    unit: function (val, unit) {
        return new (colorLib.Dimension)(val.value, unit ? unit.toCSS() : "");
    },
    convert: function (val, unit) {
        return val.convertTo(unit.value);
    },
    round: function (n, f) {
        var fraction = typeof(f) === "undefined" ? 0 : f.value;
        return this._math(function(num) { return num.toFixed(fraction); }, null, n);
    },
    pi: function () {
        return new (colorLib.Dimension)(Math.PI);
    },
    mod: function(a, b) {
        return new (colorLib.Dimension)(a.value % b.value, a.unit);
    },
    pow: function(x, y) {
        if (typeof x === "number" && typeof y === "number") {
            x = new (colorLib.Dimension)(x);
            y = new (colorLib.Dimension)(y);
        } else if (!(x instanceof colorLib.Dimension) || !(y instanceof colorLib.Dimension)) {
            throw { type: "Argument", message: "arguments must be numbers" };
        }

        return new (colorLib.Dimension)(Math.pow(x.value, y.value), x.unit);
    },
    _math: function (fn, unit, n) {
        if (n instanceof colorLib.Dimension) {
            return new (colorLib.Dimension)(fn(parseFloat(n.value)), unit == null ? n.unit : unit);
        } else if (typeof(n) === 'number') {
            return fn(n);
        } else {
            throw { type: "Argument", message: "argument must be a number" };
        }
    },
    argb: function (color) {
        return new (colorLib.Anonymous)(color.toARGB());

    },
    percentage: function (n) {
        return new (colorLib.Dimension)(n.value * 100, '%');
    },
    color: function (n) {
        if (n instanceof colorLib.Quoted) {
            return new (colorLib.Color)(n.value.slice(1));
        } else {
            throw { type: "Argument", message: "argument must be a string" };
        }
    },
    iscolor: function (n) {
        return this._isa(n, colorLib.Color);
    },
    isnumber: function (n) {
        return this._isa(n, colorLib.Dimension);
    },
    isstring: function (n) {
        return this._isa(n, colorLib.Quoted);
    },
    iskeyword: function (n) {
        return this._isa(n, colorLib.Keyword);
    },
    isurl: function (n) {
        return this._isa(n, colorLib.URL);
    },
    ispixel: function (n) {
        return this.isunit(n, 'px');
    },
    ispercentage: function (n) {
        return this.isunit(n, '%');
    },
    isem: function (n) {
        return this.isunit(n, 'em');
    },
    isunit: function (n, unit) {
        return (n instanceof colorLib.Dimension) && n.unit.is(unit.value || unit) ? colorLib.True : colorLib.False;
    },
    _isa: function (n, Type) {
        return (n instanceof Type) ? colorLib.True : colorLib.False;
    },

    /* Blending modes */

    multiply: function(color1, color2) {
        var r = color1.rgb[0] * color2.rgb[0] / 255;
        var g = color1.rgb[1] * color2.rgb[1] / 255;
        var b = color1.rgb[2] * color2.rgb[2] / 255;
        return this.rgb(r, g, b);
    },
    screen: function(color1, color2) {
        var r = 255 - (255 - color1.rgb[0]) * (255 - color2.rgb[0]) / 255;
        var g = 255 - (255 - color1.rgb[1]) * (255 - color2.rgb[1]) / 255;
        var b = 255 - (255 - color1.rgb[2]) * (255 - color2.rgb[2]) / 255;
        return this.rgb(r, g, b);
    },
    overlay: function(color1, color2) {
        var r = color1.rgb[0] < 128 ? 2 * color1.rgb[0] * color2.rgb[0] / 255 : 255 - 2 * (255 - color1.rgb[0]) * (255 - color2.rgb[0]) / 255;
        var g = color1.rgb[1] < 128 ? 2 * color1.rgb[1] * color2.rgb[1] / 255 : 255 - 2 * (255 - color1.rgb[1]) * (255 - color2.rgb[1]) / 255;
        var b = color1.rgb[2] < 128 ? 2 * color1.rgb[2] * color2.rgb[2] / 255 : 255 - 2 * (255 - color1.rgb[2]) * (255 - color2.rgb[2]) / 255;
        return this.rgb(r, g, b);
    },
    softlight: function(color1, color2) {
        var t = color2.rgb[0] * color1.rgb[0] / 255;
        var r = t + color1.rgb[0] * (255 - (255 - color1.rgb[0]) * (255 - color2.rgb[0]) / 255 - t) / 255;
        t = color2.rgb[1] * color1.rgb[1] / 255;
        var g = t + color1.rgb[1] * (255 - (255 - color1.rgb[1]) * (255 - color2.rgb[1]) / 255 - t) / 255;
        t = color2.rgb[2] * color1.rgb[2] / 255;
        var b = t + color1.rgb[2] * (255 - (255 - color1.rgb[2]) * (255 - color2.rgb[2]) / 255 - t) / 255;
        return this.rgb(r, g, b);
    },
    hardlight: function(color1, color2) {
        var r = color2.rgb[0] < 128 ? 2 * color2.rgb[0] * color1.rgb[0] / 255 : 255 - 2 * (255 - color2.rgb[0]) * (255 - color1.rgb[0]) / 255;
        var g = color2.rgb[1] < 128 ? 2 * color2.rgb[1] * color1.rgb[1] / 255 : 255 - 2 * (255 - color2.rgb[1]) * (255 - color1.rgb[1]) / 255;
        var b = color2.rgb[2] < 128 ? 2 * color2.rgb[2] * color1.rgb[2] / 255 : 255 - 2 * (255 - color2.rgb[2]) * (255 - color1.rgb[2]) / 255;
        return this.rgb(r, g, b);
    },
    difference: function(color1, color2) {
        var r = Math.abs(color1.rgb[0] - color2.rgb[0]);
        var g = Math.abs(color1.rgb[1] - color2.rgb[1]);
        var b = Math.abs(color1.rgb[2] - color2.rgb[2]);
        return this.rgb(r, g, b);
    },
    exclusion: function(color1, color2) {
        var r = color1.rgb[0] + color2.rgb[0] * (255 - color1.rgb[0] - color1.rgb[0]) / 255;
        var g = color1.rgb[1] + color2.rgb[1] * (255 - color1.rgb[1] - color1.rgb[1]) / 255;
        var b = color1.rgb[2] + color2.rgb[2] * (255 - color1.rgb[2] - color1.rgb[2]) / 255;
        return this.rgb(r, g, b);
    },
    average: function(color1, color2) {
        var r = (color1.rgb[0] + color2.rgb[0]) / 2;
        var g = (color1.rgb[1] + color2.rgb[1]) / 2;
        var b = (color1.rgb[2] + color2.rgb[2]) / 2;
        return this.rgb(r, g, b);
    },
    negation: function(color1, color2) {
        var r = 255 - Math.abs(255 - color2.rgb[0] - color1.rgb[0]);
        var g = 255 - Math.abs(255 - color2.rgb[1] - color1.rgb[1]);
        var b = 255 - Math.abs(255 - color2.rgb[2] - color1.rgb[2]);
        return this.rgb(r, g, b);
    },
    tint: function(color, amount) {
        return this.mix(this.rgb(255,255,255), color, amount);
    },
    shade: function(color, amount) {
        return this.mix(this.rgb(0, 0, 0), color, amount);
    },
    extract: function(values, index) {
        index = index.value - 1; // (1-based index)
        return values.value[index];
    }
};

var mathFunctions = [{name:"ceil"}, {name:"floor"}, {name: "sqrt"}, {name:"abs"},
    {name:"tan", unit: ""}, {name:"sin", unit: ""}, {name:"cos", unit: ""},
    {name:"atan", unit: "rad"}, {name:"asin", unit: "rad"}, {name:"acos", unit: "rad"}],
    createMathFunction = function(name, unit) {
        return function(n) {
            if (unit != null) {
                n = n.unify();
            }
            return this._math(Math[name], unit, n);
        };
    };

for(var i = 0; i < mathFunctions.length; i++) {
    colorLib.functions[mathFunctions[i].name] = createMathFunction(mathFunctions[i].name, mathFunctions[i].unit);
}

function hsla(color) {
    return colorLib.functions.hsla(color.h, color.s, color.l, color.a);
}

function scaled(n, size) {
    if (n instanceof colorLib.Dimension && n.unit.is('%')) {
        return parseFloat(n.value * size / 100);
    } else {
        return number(n);
    }
}

function clamp(val) {
    return Math.min(1, Math.max(0, val));
}

colorLib.functionCall = function(env, currentFileInfo) {
    this.env = env;
    this.currentFileInfo = currentFileInfo;
};

colorLib.functionCall.prototype = colorLib.functions;
//
// RGB Colors - #ff0014, #eee
//
colorLib.Color = function (rgb, a) {
    //
    // The end goal here, is to parse the arguments
    // into an integer triplet, such as `128, 255, 0`
    //
    // This facilitates operations and conversions.
    //
    if (Array.isArray(rgb)) {
        this.rgb = rgb;
    } else if (rgb.length === 6) {
        this.rgb = rgb.match(/.{2}/g).map(function (c) {
            return parseInt(c, 16);
        });
    } else {
        this.rgb = rgb.split('').map(function (c) {
            return parseInt(c + c, 16);
        });
    }
    this.alpha = typeof(a) === 'number' ? a : 1;
};
colorLib.Color.prototype = {
    type: "Color",
    eval: function () { return this; },
    luma: function () { return (0.2126 * this.rgb[0] / 255) + (0.7152 * this.rgb[1] / 255) + (0.0722 * this.rgb[2] / 255); },

    //
    // If we have some transparency, the only way to represent it
    // is via `rgba`. Otherwise, we use the hex representation,
    // which has better compatibility with older browsers.
    // Values are capped between `0` and `255`, rounded and zero-padded.
    //
    toCSS: function (env, doNotCompress) {
        var compress = env && env.compress && !doNotCompress;
        if (this.alpha < 1.0) {
            return "rgba(" + this.rgb.map(function (c) {
                return Math.round(c);
            }).concat(this.alpha).join(',' + (compress ? '' : ' ')) + ")";
        } else {
            var color = this.rgb.map(function (i) {
                i = Math.round(i);
                i = (i > 255 ? 255 : (i < 0 ? 0 : i)).toString(16);
                return i.length === 1 ? '0' + i : i;
            }).join('');

            if (compress) {
                color = color.split('');

                // Convert color to short format
                if (color[0] === color[1] && color[2] === color[3] && color[4] === color[5]) {
                    color = color[0] + color[2] + color[4];
                } else {
                    color = color.join('');
                }
            }

            return '#' + color;
        }
    },

    //
    // Operations have to be done per-channel, if not,
    // channels will spill onto each other. Once we have
    // our result, in the form of an integer triplet,
    // we create a new Color node to hold the result.
    //
    operate: function (env, op, other) {
        var result = [];

        if (! (other instanceof colorLib.Color)) {
            other = other.toColor();
        }

        for (var c = 0; c < 3; c++) {
            result[c] = colorLib.operate(env, op, this.rgb[c], other.rgb[c]);
        }
        return new(colorLib.Color)(result, this.alpha + other.alpha);
    },

    toHSL: function () {
        var r = this.rgb[0] / 255,
            g = this.rgb[1] / 255,
            b = this.rgb[2] / 255,
            a = this.alpha;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2, d = max - min;

        if (max === min) {
            h = s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2;               break;
                case b: h = (r - g) / d + 4;               break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s, l: l, a: a };
    },
    //Adapted from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    toHSV: function () {
        var r = this.rgb[0] / 255,
            g = this.rgb[1] / 255,
            b = this.rgb[2] / 255,
            a = this.alpha;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;

        var d = max - min;
        if (max === 0) {
            s = 0;
        } else {
            s = d / max;
        }

        if (max === min) {
            h = 0;
        } else {
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s, v: v, a: a };
    },
    toARGB: function () {
        var argb = [Math.round(this.alpha * 255)].concat(this.rgb);
        return '#' + argb.map(function (i) {
            i = Math.round(i);
            i = (i > 255 ? 255 : (i < 0 ? 0 : i)).toString(16);
            return i.length === 1 ? '0' + i : i;
        }).join('');
    },
    compare: function (x) {
        if (!x.rgb) {
            return -1;
        }

        return (x.rgb[0] === this.rgb[0] &&
            x.rgb[1] === this.rgb[1] &&
            x.rgb[2] === this.rgb[2] &&
            x.alpha === this.alpha) ? 0 : -1;
    }
};
//
// A number with a unit
//
colorLib.Dimension = function (value, unit) {
    this.value = parseFloat(value);
    this.unit = (unit && unit instanceof colorLib.Unit) ? unit :
            new (colorLib.Unit)(unit ? [unit] : undefined);
};

colorLib.Dimension.prototype = {
    type: "Dimension",
    accept: function (visitor) {
        this.unit = visitor.visit(this.unit);
    },
    'eval': function (env) {
        return this;
    },
    toColor: function () {
        return new (colorLib.Color)([this.value, this.value, this.value]);
    },
    toCSS: function (env) {
        if ((env && env.strictUnits) && !this.unit.isSingular()) {
            throw new Error("Multiple units in dimension. Correct the units or use the unit function. Bad unit: " + this.unit.toString());
        }

        var value = this.value,
            strValue = String(value);

        if (value !== 0 && value < 0.000001 && value > -0.000001) {
            // would be output 1e-6 etc.
            strValue = value.toFixed(20).replace(/0+$/, "");
        }

        if (env && env.compress) {
            // Zero values doesn't need a unit
            if (value === 0 && !this.unit.isAngle()) {
                return strValue;
            }

            // Float values doesn't need a leading zero
            if (value > 0 && value < 1) {
                strValue = (strValue).substr(1);
            }
        }

        return strValue + this.unit.toCSS(env);
    },

    // In an operation between two Dimensions,
    // we default to the first Dimension's unit,
    // so `1px + 2` will yield `3px`.
    operate: function (env, op, other) {
        var value = colorLib.operate(env, op, this.value, other.value),
            unit = this.unit.clone();

        if (op === '+' || op === '-') {
            if (unit.numerator.length === 0 && unit.denominator.length === 0) {
                unit.numerator = other.unit.numerator.slice(0);
                unit.denominator = other.unit.denominator.slice(0);
            } else if (other.unit.numerator.length === 0 && unit.denominator.length === 0) {
                // do nothing
            } else {
                other = other.convertTo(this.unit.usedUnits());

                if (env.strictUnits && other.unit.toString() !== unit.toString()) {
                    throw new Error("Incompatible units. Change the units or use the unit function. Bad units: '" + unit.toString() +
                    "' and '" + other.unit.toString() + "'.");
                }

                value = colorLib.operate(env, op, this.value, other.value);
            }
        } else if (op === '*') {
            unit.numerator = unit.numerator.concat(other.unit.numerator).sort();
            unit.denominator = unit.denominator.concat(other.unit.denominator).sort();
            unit.cancel();
        } else if (op === '/') {
            unit.numerator = unit.numerator.concat(other.unit.denominator).sort();
            unit.denominator = unit.denominator.concat(other.unit.numerator).sort();
            unit.cancel();
        }
        return new (colorLib.Dimension)(value, unit);
    },

    compare: function (other) {
        if (other instanceof colorLib.Dimension) {
            var a = this.unify(), b = other.unify(),
                aValue = a.value, bValue = b.value;

            if (bValue > aValue) {
                return -1;
            } else if (bValue < aValue) {
                return 1;
            } else {
                if (!b.unit.isEmpty() && a.unit.compare(b.unit) !== 0) {
                    return -1;
                }
                return 0;
            }
        } else {
            return -1;
        }
    },

    unify: function () {
        return this.convertTo({ length: 'm', duration: 's', angle: 'rad' });
    },

    convertTo: function (conversions) {
        var value = this.value, unit = this.unit.clone(),
            i, groupName, group, conversion, targetUnit, derivedConversions = {};

        if (typeof conversions === 'string') {
            for(i in colorLib.UnitConversions) {
                if (colorLib.UnitConversions[i].hasOwnProperty(conversions)) {
                  derivedConversions = {};
                  derivedConversions[i] = conversions;
                }
            }
            conversions = derivedConversions;
        }

        for (groupName in conversions) {
            if (conversions.hasOwnProperty(groupName)) {
                targetUnit = conversions[groupName];
                group = colorLib.UnitConversions[groupName];

                unit.map(function (atomicUnit, denominator) {
                    if (group.hasOwnProperty(atomicUnit)) {
                        if (denominator) {
                            value = value / (group[atomicUnit] / group[targetUnit]);
                        } else {
                            value = value * (group[atomicUnit] / group[targetUnit]);
                        }

                        return targetUnit;
                    }

                    return atomicUnit;
                });
            }
        }

        unit.cancel();

        return new(colorLib.Dimension)(value, unit);
    }
};

// http://www.w3.org/TR/css3-values/#absolute-lengths
colorLib.UnitConversions = {
    length: {
        'm': 1,
        'cm': 0.01,
        'mm': 0.001,
        'in': 0.0254,
        'pt': 0.0254 / 72,
        'pc': 0.0254 / 72 * 12
    },
    duration: {
        's': 1,
        'ms': 0.001
    },
    angle: {
        'rad': 1/(2*Math.PI),
        'deg': 1/360,
        'grad': 1/400,
        'turn': 1
    }
};

colorLib.Unit = function (numerator, denominator, backupUnit) {
    this.numerator = numerator ? numerator.slice(0).sort() : [];
    this.denominator = denominator ? denominator.slice(0).sort() : [];
    this.backupUnit = backupUnit;
};

colorLib.Unit.prototype = {
    type: "Unit",
    clone: function () {
        return new colorLib.Unit(this.numerator.slice(0), this.denominator.slice(0), this.backupUnit);
    },

    toCSS: function (env) {
        if (this.numerator.length >= 1) {
            return this.numerator[0];
        }
        if (this.denominator.length >= 1) {
            return this.denominator[0];
        }
        if ((!env || !env.strictUnits) && this.backupUnit) {
            return this.backupUnit;
        }
        return "";
    },

    toString: function () {
        var i, returnStr = this.numerator.join("*");
        for (i = 0; i < this.denominator.length; i++) {
          returnStr += "/" + this.denominator[i];
        }
        return returnStr;
    },

    compare: function (other) {
        return this.is(other.toString()) ? 0 : -1;
    },

    is: function (unitString) {
        return this.toString() === unitString;
    },

    isAngle: function () {
        return colorLib.UnitConversions.angle.hasOwnProperty(this.toCSS());
    },

    isEmpty: function () {
        return this.numerator.length === 0 && this.denominator.length === 0;
    },

    isSingular: function() {
        return this.numerator.length <= 1 && this.denominator.length === 0;
    },

    map: function(callback) {
        var i;

        for (i = 0; i < this.numerator.length; i++) {
            this.numerator[i] = callback(this.numerator[i], false);
        }

        for (i = 0; i < this.denominator.length; i++) {
            this.denominator[i] = callback(this.denominator[i], true);
        }
    },

    usedUnits: function() {
        var group, groupName, result = {};

        for (groupName in colorLib.UnitConversions) {
            if (colorLib.UnitConversions.hasOwnProperty(groupName)) {
                group = colorLib.UnitConversions[groupName];

                this.map(function (atomicUnit) {
                    if (group.hasOwnProperty(atomicUnit) && !result[groupName]) {
                        result[groupName] = atomicUnit;
                    }

                    return atomicUnit;
                });
            }
        }

        return result;
    },

    cancel: function () {
        var counter = {}, atomicUnit, i, backup;

        for (i = 0; i < this.numerator.length; i++) {
            atomicUnit = this.numerator[i];
            if (!backup) {
                backup = atomicUnit;
            }
            counter[atomicUnit] = (counter[atomicUnit] || 0) + 1;
        }

        for (i = 0; i < this.denominator.length; i++) {
            atomicUnit = this.denominator[i];
            if (!backup) {
                backup = atomicUnit;
            }
            counter[atomicUnit] = (counter[atomicUnit] || 0) - 1;
        }

        this.numerator = [];
        this.denominator = [];

        for (atomicUnit in counter) {
          if (counter.hasOwnProperty(atomicUnit)) {
            var count = counter[atomicUnit];

            if (count > 0) {
              for (i = 0; i < count; i++) {
                this.numerator.push(atomicUnit);
              }
            } else if (count < 0) {
              for (i = 0; i < -count; i++) {
                this.denominator.push(atomicUnit);
              }
            }
          }
        }

        if (this.numerator.length === 0 && this.denominator.length === 0 && backup) {
            this.backupUnit = backup;
        }

        this.numerator.sort();
        this.denominator.sort();
    }
};
})(this);