/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

/* Author:			Bruno Windels
 * Summary:			Utility method to define and combine namespaces/modules
 * Example usage:	bw.namespace("emcalc.tree",function(ns){
 *                      ns.importNS(some.other.ns);
 *                      ns.importedsymbol;
 *                      return publicsymbols;
 *					});
 */


var bw;
if(!bw) {
	bw = {};
}

bw.parseNS = function(ns) {
	var i,
		parts = ns.split("."),
		scope,
		part;
	
	for(i=0;i<parts.length;++i) {
		parts[i] = parts[i].trim();
		if(parts[i].length===0) {
			throw "invalid namespace "+ns;
		}
	}
	scope = (function(){return this;}());	//init with global object
	i = 0;
	for(i=0;i<parts.length;++i) {
		part = parts[i];
		if(!scope[part]) {
			scope[part] = {};
		}
		scope = scope[part];
	}
	return scope;
};

bw.NS = function() {};

bw.NS.prototype.importNS = function(o) {
	var importCount = 0, key;
	if(typeof o === "string") {
		o = bw.parseNS(o);
	}
	if(o) {
		for(key in o) {
			if(o.hasOwnProperty(key)) {
				if(this.hasOwnProperty(key)) {
					throw "conflicting symbol in import: "+key;
				}
				this[key] = o[key];
				++importCount;
			}
		}
		if(importCount===0) {
			throw "nothing imported";
		}
	}
};

bw.namespace = function(ns,fn){
	var scope = bw.parseNS(ns),
		value = fn.call(scope,new bw.NS()),
		key;
	if(value) {
		for(key in value) {
			if(value.hasOwnProperty(key)) {
				scope[key] = value[key];
			}
		}
	}
};