var NamespaceTest = TestCase("NamespaceTest");

NamespaceTest.prototype.testNameSpace = function() {
	expectAsserts(9);
	var globalObject = (function(){return this;}());
	
	bw.namespace("first.things.first",function(){return {hello:"world"};});
	bw.namespace("second.things.second",function(){return {hello:"cruel world"};});
	
	bw.namespace("foo.bar",function(){return {a:1,b:5};});
	assertEquals("b was not assigned",5,globalObject.foo.bar.b);
	bw.namespace("foo.bar",function(ns){
		ns.importNS(first.things.first);
		assertEquals("import for namespace test did not work","world",ns.hello);
		assertEquals("b was available inside namespace",5,this.b);
		var thrown = false;
		try {
			ns.importNS(second.things.second);
		} catch(e) {
			thrown = true;
		}
		assertTrue("conflicting import did not throw an exception",thrown);
		return {c:3,b:2};
	});
	assertEquals("b was not reassigned",2,globalObject.foo.bar.b);
	assertEquals("a was not kept",1,globalObject.foo.bar.a);
	assertEquals("c was not newly assigned",3,globalObject.foo.bar.c);
	bw.namespace("foo.bar.ney",function(){return {d:7};});
	assertEquals("foo.bar was not properly combined with a subnamespace",2,globalObject.foo.bar.b);
	assertEquals("subnamespace was not properly assigned",7,globalObject.foo.bar.ney.d);
};