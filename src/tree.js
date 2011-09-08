/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

/* Author:			Bruno Windels
 * Summary:			Definition of expression tree types
 */

bw.namespace("emcalc.tree",function() {

//expression tree value containing an "em" literal
var EmTreeValue = function(em) {
	this.emVal = em;
};

EmTreeValue.prototype.em = function() {
	return this.emVal;
};

EmTreeValue.prototype.toString = function() {
	return this.emVal+"em";
};

//expression tree value containing an "px" literal
var PxTreeValue = function(px,selector,config) {
	this.pxVal = px;
	this.selector = selector;
	this.config = config;
};

PxTreeValue.prototype.em = function() {
	var fontSize = this.selector.getSelectorProperty("fontSize");
	var base = this.config.basePixelSize;
	return (1/(base*fontSize.em()))*this.pxVal;
};

PxTreeValue.prototype.toString = function() {
	return this.pxVal+"px";
};

//expression tree value containing a reference to another property
var RefTreeValue = function(val) {
	this.val = val;
};

RefTreeValue.prototype.em = function() {
	return this.val.em();
};

RefTreeValue.prototype.toString = function() {
	return this.val.name;
};

//expression tree value for calculating a mathematical expression for two subvalues
var MathTreeValue = function(op,a,b) {
	this.op = op;
	this.a = a;
	this.b = b;
};

MathTreeValue.prototype.em = (function() {
	//build hash table with supported operators
	var ops = {};
	ops['+'] = function(a,b) {return a.em()+b.em();};
	ops['-'] = function(a,b) {return a.em()-b.em();};
	ops['/'] = function(a,b) {return a.em()/b.em();};
	ops['*'] = function(a,b) {return a.em()*b.em();};
	
	return function() {
		if(ops.hasOwnProperty(this.op)) {
			var opFn = ops[this.op];
			return opFn(this.a,this.b);
		}
		throw "unknown operator "+this.op;
	};
}());

MathTreeValue.prototype.toString = function() {
	/* dirty trick that polymorphism would frown upon to avoid
	 * putting unnessary parenthesis in expressions when regenerating them.
	 * basically we check if our subvalues are compound values too. */
	var pA = this.a.a && true;
	var pB = this.b.a && true;
	
	return	(pA?'(':'')+
			this.a.toString()+
			(pA?')':'')+
			this.op+(pB?'(':'')+
			this.b.toString()+
			(pB?')':'');
};

return {
	EmTreeValue:EmTreeValue,
	PxTreeValue:PxTreeValue,
	RefTreeValue:RefTreeValue,
	MathTreeValue:MathTreeValue
};

});