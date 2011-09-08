var TextStreamTest = TestCase("TextStreamTest");

TextStreamTest.prototype.testJumps = function() {
	var r = new emcalc.util.TextStream("this text");

	assertTrue(r.next()=='t');
	assertTrue(r.next()=='h');
	assertTrue(r.next()=='i');
	assertTrue(r.next()=='s');
	assertTrue(r.next()==' ');
	r.mark();
	assertTrue(r.next()=='t');
	assertTrue(r.next()=='e');
	assertTrue(r.next()=='x');
	assertTrue(r.next()=='t');	
	assertTrue(r.next()===false);
	r.backToMark();
	r.next();
	r.next();
	r.next();
	assertTrue(r.next()=='t');	
	assertTrue(r.next()===false);
	assertTrue(r.next()===false);	//on eof keep returning false
	assertTrue(r.next()===false);
};
