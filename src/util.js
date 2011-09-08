/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

/* Author:			Bruno Windels
 * Summary:			Utility methods for easier string parsing and other stuff
 */

bw.namespace("emcalc.util",function() {


//utility class for representing a string as a text stream in which one can navigate
var TextStream = function(str) {
	this.str = str;
	this.index = 0;
	this.markIndex = 0;
};

TextStream.prototype.next = function() {
	if(this.index>=this.str.length) {
		return false;
	} else {
		var chr = this.str.charAt(this.index);
		++this.index;
		return chr;
	}
};

TextStream.prototype.nextCharCode = function() {
	if(this.index>=this.str.length) {
		return false;
	} else {
		var chr = this.str.charCodeAt(this.index);
		++this.index;
		return chr;
	}
};

TextStream.prototype.markPrevious = function() {
	this.markIndex = this.index-1;
};

TextStream.prototype.mark = function() {
	this.markIndex = this.index;
};

TextStream.prototype.markedString = function() {
	return this.str.substring(this.markIndex,this.index);
};

TextStream.prototype.backToMark = function() {
	this.index=this.markIndex;
};

TextStream.prototype.markLength = function() {
	return this.index-this.markIndex;
};

TextStream.prototype.moveBack = function(count) {
	this.index-=count;
};


var cssName = function(name) {
	var buf = '', i = 0;
	for(;i<name.length;++i) {
		if(name.charCodeAt(i)>='A'.charCodeAt(0) && name.charCodeAt(i)<='Z'.charCodeAt(0)) {
			buf = buf + '-' + String.fromCharCode(name.charCodeAt(i)-('A'.charCodeAt(0)-'a'.charCodeAt(0)));
		} else {
			buf = buf + name.charAt(i);
		}
	}
	return buf;
};

//return public symbols
return {
	TextStream: TextStream,
	cssName: cssName	
};

});