js-color-lib
============

a collection of color manipulation functions.


##Usage

```javascript
// get a color instance from RGB
var colorObj = new colorLib.Color(rgbArr),
	alpha = colorObj.alpha,
	rgb = colorObj.rgb,
	hexColor = colorObj.toCSS(),
	hsv = colorObj.toHSV();

// get a color instance from HSV
var h = hsv.h,
	s = hsv.s,
	v = hsv.v,
	colorObjFromHSV = colorLib.functions.hsvToRgb(h, s, v);
```