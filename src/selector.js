/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

/* Author:			Bruno Windels
 * Summary:			Model classes for selector and selector properties
 */
bw.namespace("emcalc.selector",function(ns) {

ns.importNS(emcalc.util);

//model class to represent on property within a selector
var SelectorProperty = function(value,selector,name,config) {
	this.config = config;
	this.rootValue = null;
	this.selector = selector;
	this.name = name;
	
	this.update(value);
};

SelectorProperty.prototype.update = function(value) {
	this.value = value;
	this.parse();
};

SelectorProperty.prototype.parse = function() {
	try {
		delete this.msg;
		this.error = false;
		delete this.rootValue;
		this.rootValue = this.config.parser.parse(new ns.TextStream(this.value),this.selector,this.config);
	} catch(e) {
		if(typeof e !== "string") {
			throw e;
		}
		this.msg = e;
		this.error = true;
	}
	if(!this.rootValue) {
		if(!this.error) {
			this.msg = "value missing";
			this.error = true;
		}
	}
	else {
		this.error = false;
	}
};

SelectorProperty.prototype.errorMessage = function() {
	return this.msg;
};

SelectorProperty.prototype.em = function() {
	if(!this.rootValue) {
		return 0;
	}
	var val = this.rootValue.em();
	//round to 3 decimals
	return Math.round(val*1000)/1000.0;
};

SelectorProperty.prototype.toString = function() {
	if(!this.rootValue) {
		return this.value;
	}
	return this.rootValue.toString();
};

SelectorProperty.prototype.rename = function(name) {
	delete this.selector.props[this.name];
	this.selector.props[name] = this;
	this.name = name;
};

SelectorProperty.prototype.cssName = (function() {
	return function() {return ns.cssName(this.name);};
}());

//model class representing a selector. contains various SelectorPropertys
var Selector = function(config,props) {
	var key;
	this.config = config;
	this.props = {};
	if(props) {
		for(key in props) {
			if(props.hasOwnProperty(key)) {
				this.props[key] = new SelectorProperty(props[key],this,key,this.config);
			}
		}
	}
};

Selector.prototype.toJSON = function() {
	var key;
	var buf = '{';
	var first = true;
	for(key in this.props) {
		if(this.props.hasOwnProperty(key)) {
			buf = buf+(!first?',"':'"')+key+"\":\""+this.props[key].toString()+"\"";
			first = false;
		}
	}
	buf = buf+'}';
	return buf;
};

Selector.prototype.getOrCreateProp = function(name) {
	if(!this.props[name]) {
		this.props[name] = new SelectorProperty("",this,name,this.config);
	}
	return this.props[name];
};

Selector.prototype.getSelectorProperty = function(name) {
	return this.props[name];
};

Selector.prototype.getSelectorProperties = function() {
	var list = [], key;
	for(key in this.props) {
		if(this.props.hasOwnProperty(key)) {
			list.push(key);
		}
	}
	return list;
};

return {
	Selector:Selector
};

});