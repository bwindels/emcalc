var ParserTest = TestCase("ParserTest");

ParserTest.prototype.testParser = function() {
	var config = {basePixelSize:10};
	var parser = new emcalc.parser.ValueParser();
	config.parser = parser;
	var selector = new emcalc.selector.Selector(config,{"fontSize":"1em"});
	
	var stream = new emcalc.util.TextStream("1px");
	var root = parser.parse(stream,selector,config);
	assertEquals("em value is wrong",0.1,root.em());
	var stream = new emcalc.util.TextStream("fontSize/2em");
	root = parser.parse(stream,selector,config);
	assertEquals("em value is wrong",0.5,root.em());
};
