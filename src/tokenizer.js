/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

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

});