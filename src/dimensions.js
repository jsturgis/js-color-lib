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