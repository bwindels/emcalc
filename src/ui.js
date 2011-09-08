/* jslint devel: true, browser: true, sloppy: true, vars: true, white: true, plusplus: true, maxerr: 50, indent: 4 */

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