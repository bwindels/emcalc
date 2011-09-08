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
};/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

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

});/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

/* Author:			Bruno Windels
 * Summary:			Tokenizer and token types
 */

bw.namespace("emcalc.parser.tokenizer",function() {
//token types
//numeric literal token type, singleton object
var NumberType = {
	family: 1,
	tryParse: function(stream) {
		var c;
		while((c=stream.nextCharCode())!==false) {
			if(!((c>='0'.charCodeAt(0) && c<='9'.charCodeAt(0)) || c==='.'.charCodeAt(0))) {
				stream.moveBack(1);
				if(stream.markLength()!==0) {
					return stream.markedString();
				} else {
					return false;
				}
			}
		}
		if(stream.markLength()!==0) {
			return stream.markedString();
		} else {
			return false;
		}
	}
};
//unit literal token type, singleton object
var UnitType = {
	family: 2,
	tryParse: function(stream) {
		if(stream.next()==='p' && stream.next()==='x') {
			return 'px';
		} else {
			stream.backToMark();
			stream.mark();
			if(stream.next()==='e' && stream.next()==='m') {
				return 'em';
			}
		}
		return false;
	}
};
//identifier token type, singleton object
var RefNameType = {
	family: 3,
	tryParse: function(stream) {
		var c;
		while((c=stream.nextCharCode())!==false) {
			if((c<'a'.charCodeAt(0) || c>'z'.charCodeAt(0)) && (c<'A'.charCodeAt(0) || c>'Z'.charCodeAt(0))) {
				stream.moveBack(1);
				if(stream.markLength()!==0) {
					return stream.markedString();
				} else {
					return false;
				}
			}
		}
		if(stream.markLength()!==0) {
			return stream.markedString();
		} else {
			return false;
		}
	}
};
//parenthesis token type, singleton object
var GroupType = {
	family: 4,
	tryParse: function(stream) {
		var c = stream.next();
		if(c==='(') {
			return '(';
		} else if(c===')') {
			return ')';
		}
		return false;
	}
};
//operator token type, singleton object
var OperatorType = {
	family: 5,
	tryParse: function(stream) {
		var c = stream.next();
		if(c==='+') {
			return '+';
		} else if(c==='-') {
			return '-';
		} else if(c==='/') {
			return '/';
		} else if(c==='*') {
			return '*';
		}
		return false;
	}
};

//delegates tokenization to different tokentypes. note that order is important here
var Tokenizer = function(types) {
	this.types = types;
};

Tokenizer.prototype.nextToken = function(stream) {
	var i, tokentype, token;
	for(i=0;i<this.types.length;++i) {
		stream.mark();
		tokentype = this.types[i];
		token = tokentype.tryParse(stream);
		if(token!==false) {
			return {token:token,family:tokentype.family};
		}
		stream.backToMark();
	}
	return false;
};

return {
	Tokenizer:Tokenizer,
	NumberType:NumberType,
	UnitType:UnitType,
	RefNameType:RefNameType,
	GroupType:GroupType,
	OperatorType:OperatorType
};

});/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

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

});/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

/* Author:			Bruno Windels
 * Summary:			Expression parser
 */
bw.namespace("emcalc.parser",function(ns) {

ns.importNS(emcalc.parser.tokenizer);
ns.importNS(emcalc.tree);

/* utility class used in the parser to represent
 * a state in which the parser expects a certain value */
var Expect = function(error, optional) {
	this.error = error;
	this.optional = optional;
};

Expect.prototype.check = function() {
	var found = false, i;
	for(i=0;i<arguments.length;++i) {
		if(arguments[i]===this) {
			found = true;
		}
	}
	if(!found) {
		throw this.error;
	}
};
/* constants using inside the parser to know
 * what we are expecting next. Also used for error messages */
var Expecting = {
	LeftOperand:	new Expect("Value expected",false),
	Unit:			new Expect("Expected a unit after a number",true),
	RightOperand:	new Expect("Expected a value (numeric or variable)",true),
	Operator:		new Expect("Expected an operator (+, -, / or *)",false)
};

/* utility class used in the parser to keep track of 
 * what we are expecting next. works like a stack 
 * because we allow nested parenthesis and operands
 * that are compound out of several tokens (e.g. "1" and "px") */
var ParserState = function() {
	this.states = [];
};

ParserState.prototype.state = function() {
	if(this.states.length===0) {
		return Expecting.LeftOperand;
	}
	return this.states[this.states.length-1];
};

ParserState.prototype.expect = function(state) {
	this.states.push(state);
};

ParserState.prototype.checkMet = function(family) {
	var s = this.state();
	if(family===ns.NumberType.family) {
		s.check(Expecting.LeftOperand,Expecting.RightOperand);
	}
	else if(family===ns.UnitType.family) {
		s.check(Expecting.Unit);
	}
	else if(family===ns.RefNameType.family) {
		s.check(Expecting.LeftOperand,Expecting.RightOperand);
	}
	else if(family===ns.OperatorType.family) {
		s.check(Expecting.Operator);
	}
	else if(family===ns.GroupType.family) {
		s.check(Expecting.Operator,Expecting.LeftOperand,Expecting.RightOperand);
	}
	
	return s;
};

ParserState.prototype.pop = function() {
	if(this.states.length!==0) {
		this.states.pop();
	}
};

var OperandStack = function(state) {
	this.state = state;
	this.stack = [];
};

OperandStack.prototype.getLeftOperand = function(){
	return this.peek().leftOperand;
};

OperandStack.prototype.setLeftOperand = function(o){
	this.peek().leftOperand = o;
};

OperandStack.prototype.getOperator = function(){
	return this.peek().operator;
};

OperandStack.prototype.setOperator = function(o){
	this.peek().operator = o;
};

OperandStack.prototype.peek = function(o){
	return this.stack[this.stack.length-1];
};

OperandStack.prototype.size = function(o){
	return this.stack.length;
};

OperandStack.prototype.first = function(){
	return this.stack[0];
};

OperandStack.prototype.push = function(o){
	this.stack.push({});
};

OperandStack.prototype.pop = function(o){
	return this.stack.pop();
};

OperandStack.prototype.setOperand = function(operand) {
	if(this.state.state()===Expecting.RightOperand) {
		this.setLeftOperand(new ns.MathTreeValue(this.getOperator(),this.getLeftOperand(),operand));
	} else if(this.state.state()===Expecting.LeftOperand) {
		this.setLeftOperand(operand);
	} else {
		throw "not expecting a value now";
	}
	this.state.pop();
	this.state.expect(Expecting.Operator);
};

/* The parser class */
var ValueParser = function() {
	var tokenTypes = [ns.NumberType,ns.UnitType,ns.RefNameType,ns.GroupType,ns.OperatorType];
	this.tokenizer = new ns.Tokenizer(tokenTypes);
};

ValueParser.prototype.parse = function(stream,selector,config) {
	var token = null,
		state = new ParserState(),
		stack = new OperandStack(state),
		numberToken;
	
	stack.push();
	state.expect(Expecting.LeftOperand);
	//loop through all the tokens
	while((token=this.tokenizer.nextToken(stream))!==false) {
		try {
			//check if we are still in line
			state.checkMet(token.family);
			//handle numeric literal
			if(token.family===ns.NumberType.family) {
				numberToken = token;
				state.expect(Expecting.Unit);
			}
			//handle unit literal
			else if(token.family===ns.UnitType.family) {
				state.pop(); //pop expecting Unit
				if(token.token==='px') {
					stack.setOperand(new ns.PxTreeValue(parseInt(numberToken.token,10),selector,config));
				} else if(token.token==='em') {
					stack.setOperand(new ns.EmTreeValue(parseFloat(numberToken.token)));
				}
			}
			//handle identifier
			else if(token.family===ns.RefNameType.family) {
				if(!selector.getSelectorProperty(token.token)) {
					throw "property "+token.token+" not found in this selector, available are "+selector.getSelectorProperties().join(",");
				}
				stack.setOperand(new ns.RefTreeValue(selector.props[token.token]));
			}
			//handle operator
			else if(token.family===ns.OperatorType.family) {
				stack.setOperator(token.token);
				state.pop();
				state.expect(Expecting.RightOperand);
			}
			//handle parenthesis
			else if(token.family===ns.GroupType.family) {
				if(token.token==='(') {
					stack.push();
					state.expect(Expecting.LeftOperand);
				} else if(token.token===')') {
					var operand = stack.pop().leftOperand;
					state.pop();	//pop the operator state
					stack.setOperand(operand);
				}
			}
		} catch(error) {
			if(typeof error !== "string") {
				throw error;
			}
			throw error+", instead found "+token.token;
		}
	}
	
	if(stack.size()!==1) {
		throw "parenthesis not closed";
	}
	return stack.first().leftOperand;
};

return {ValueParser:ValueParser};

});/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

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

});/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

/* Author:			Bruno Windels
 * Summary:			dynamic generation of the UI
 */

// module emcalc.tree
bw.namespace("emcalc.ui",function(ns) {

ns.importNS(emcalc.selector);
ns.importNS(emcalc.util);

//manages the UI for one property within one selector
var SelectorPropertyInput = function(parent,value,name) {
	this.parent = parent;
	this.selectorValue = value;
	this.error = false;
	this.nameLength = 0;
	this.valueLength = 0;
	this.name = name || '';
	//build html
	this.element = document.createElement('div');
	this.nameInput = document.createElement('input');
	this.nameInput.setAttribute('type','text');
	this.nameInput.setAttribute('spellcheck','false');

	this.nameInput.className = "propname";
	this.valueInput = document.createElement('input');
	this.valueInput.setAttribute('type','text');
	this.valueInput.setAttribute('spellcheck','false');
	
	this.valueInput.className = "propvalue";
	this.errorIcon = document.createElement('div');
	this.errorIcon.className = "errorexcl";
	var errorSpan = document.createElement('span');
	errorSpan.innerText = '!';
	this.errorIcon.appendChild(errorSpan);
	this.showErrorIcon(false);
	this.element.appendChild(this.nameInput);
	this.element.appendChild(this.valueInput);
	this.element.appendChild(this.errorIcon);
	//wire up events
	var pointer = this;
	this.valueInput.addEventListener('input',function(e){
		if(pointer.value().length!==pointer.valueLength) {
			pointer.valueLength = pointer.value().length;
			pointer.updateModel();
		}
	},false);
	this.valueInput.addEventListener('keypress',function(e){
		if(e.keyCode===13) {
			pointer.parent.addRule();
		}
	},false);
	this.nameInput.addEventListener('input',function(){
		if(pointer.ruleName().length!==pointer.nameLength) {
			pointer.nameLength = pointer.ruleName().length;
			pointer.updateModelName();
		}
	},false);
	
	if(this.selectorValue) {
		this.valueInput.value = this.selectorValue.toString();
	}
	this.nameInput.value = this.name;
};

SelectorPropertyInput.prototype.setNameAndValue = function(name,value) {
	this.nameInput.value = name;
	this.valueInput.value = value;
};

SelectorPropertyInput.prototype.updateUI = function() {
	if(this.selectorValue) {
		this.valueInput.value = this.selectorValue.toString();
	}
};

SelectorPropertyInput.prototype.updateModel = function() {
	if(!this.selectorValue) {
		return;
	}
	
	this.selectorValue.update(this.value());
	this.showErrorIcon(this.selectorValue.error);
	this.parent.updateCSS();
};

SelectorPropertyInput.prototype.updateModelName = function() {
	if(!this.selectorValue) {
		this.selectorValue = this.parent.selector.getOrCreateProp(this.ruleName());
	} else {
		this.selectorValue.rename(this.ruleName());
	}
	this.parent.updateAllRulesValues();
	this.parent.updateCSS();
};

SelectorPropertyInput.prototype.ruleName = function() {
	return this.nameInput.value;
};

SelectorPropertyInput.prototype.value = function() {
	return this.valueInput.value;
};

SelectorPropertyInput.prototype.showErrorIcon = function(e) {
	this.errorIcon.style.display = (e?'block':'none');
};

SelectorPropertyInput.prototype.focus = function() {
	this.nameInput.focus();
};

//manages the UI for one selector
var SelectorInput = function(name,config,value) {
	var key,titleBlock,footerBlock, props,i;
	if(!value) {
		value = {};
	}
	if(!value.fontSize) {
		value.fontSize = "1em";
	}
	
	this.selector = new ns.Selector(config,value);
	this.rules = [];
	
	//build html
	this.element = document.createElement('div');
	this.element.className = 'selectorContainer';
	
	titleBlock = document.createElement('p');
	titleBlock.className = 'containerTitle';
	titleBlock.appendChild(document.createTextNode('.'));
	this.titleElement = document.createElement('span');
	this.titleElement.setAttribute('contenteditable','true');
	this.titleElement.setAttribute('spellcheck','false');
	titleBlock.appendChild(this.titleElement);
	titleBlock.appendChild(document.createTextNode(' {'));
	this.element.appendChild(titleBlock);
	
	this.ruleContainer = document.createElement('div');
	this.ruleContainer.className = 'input';
	this.element.appendChild(this.ruleContainer);
	
	footerBlock = document.createElement('p');
	footerBlock.className = 'containerFooter';
	footerBlock.appendChild(document.createTextNode('}'));
	this.element.appendChild(footerBlock);
	
	this.cssContainer = document.createElement('div');
	this.cssContainer.className = 'css';
	this.element.appendChild(this.cssContainer);
	this.setName(name);
	
	props = this.selector.getSelectorProperties();
	for(i = 0;i<props.length;++i) {
		key = props[i];
		var rule = new SelectorPropertyInput(this,this.selector.getSelectorProperty(key),key);
		this.rules.push(rule);
		this.ruleContainer.appendChild(rule.element);
	}
	
	this.updateCSS();
};

SelectorInput.prototype.setName = function(name) {
	this.name = name;
	this.titleElement.innerText = name;
};

SelectorInput.prototype.getName = function() {
	return this.titleElement.innerText;
};

SelectorInput.prototype.addRule = function() {
	var rule = new SelectorPropertyInput(this);
	this.rules.push(rule);
	this.ruleContainer.appendChild(rule.element);
	rule.focus();
	return rule;
};

SelectorInput.prototype.addRuleWithValue = function(name,value) {
	var rule = this.addRule();
	rule.setNameAndValue(name,value);
};

SelectorInput.prototype.updateCSS = function() {
	var hasError = false, key, val, p, errorMessages = [], i, props;
	
	props = this.selector.getSelectorProperties();
	for(i = 0;i<props.length;++i) {
		key = props[i];
		val = this.selector.getSelectorProperty(key);
		if(val.error) {
			hasError = true;
			errorMessages.push(ns.cssName(key)+": "+val.errorMessage());
		}
	}
	this.cssContainer.innerHTML = '';
	if(hasError) {
		for(i=0;i<errorMessages.length;++i) {
			p = document.createElement('p');
			p.innerText = errorMessages[i];
			this.cssContainer.appendChild(p);
		}
		return;
	}
	
	for(i = 0;i<props.length;++i) {
		key = props[i];
		p = document.createElement('p');
		val = this.selector.getSelectorProperty(key);
		p.innerText = val.cssName()+": "+val.em()+"em;";
		this.cssContainer.appendChild(p);
	}
};

SelectorInput.prototype.updateAllRulesValues = function() {
	var i;
	for(i=0;i<this.rules.length;++i) {
		this.rules[i].updateUI();
	}
};

return {SelectorInput: SelectorInput};

});