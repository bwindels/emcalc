/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

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

});