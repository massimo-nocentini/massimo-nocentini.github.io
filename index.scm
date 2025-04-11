
(import unittest)

(define tree (sxml-tree '("Massimo Nocentini" 
                        (p "This site is a collection of " (em "Massimo Nocentini") 
                           "'s papers, notes, memos and source code, in the spirit of "
                           (cite/a "https://www.stepanovpapers.com/") "."))
                        `((structure/section "Contacts")
                          (ul
                            (li (em "+39 320 1162059 (mobile)"))
                            (li "Personal mail " 
				(cite/a "mailto:Massimo Nocentini <massimo.nocentini@gmail.com>" (code "massimo.nocentini@gmail.com")))
                            (li "University of Florence mail " 
				(cite/a "mailto:Massimo Nocentini <massimo.nocentini@unifi.it>" (code "massimo.nocentini@unifi.it")))
                            (li "Github page "
				(cite/a "https://github.com/massimo-nocentini/" (code "https://github.com/massimo-nocentini")))
                            (li "Public RSA key "
				(cite/a "https://raw.githubusercontent.com/massimo-nocentini/massimo-nocentini.github.io/master/id_rsa.pub")))

                          (structure/section "On Smalltalk")
			  (dl
			    (di "Booklet on data structures"
				(p "I have a working in progress booklet "
				   (cite/a "https://massimo-nocentini.github.io/Booklet-DSst/" 
					   "Booklet on data structures, in Pharo Smalltalk.")
				   " about data structures, using the Pharo dialect.")))

                          (structure/section "On Scheme")
                          (p "From the R6RS Ballot, reported in " (cite/a "https://wiki.call-cc.org/elevator-pitch") ":")
                          (cite/quote "Jeffrey Mark Siskind, author of Stalin and current (unofficial) maintainer of Scheme->C"
                                      (i "Scheme occupies a unique niche. A research niche and an educational
					 niche. It is not a language. Not R6RS, not R5RS, not R4Rs. It is an
					 idea. Or a collection of ideas. It is a framework. It is a way of
					 thinking. It is a mindset. All of this is embodied in an ever growing
					 family of languages or dialects, not a single language. It is a
					 virus. It is the ultimate programming-language virus. 
					  The cat is already out of the bag and there is no way to get it back
					  in. Once someone gets the mindset, they can implement their own
					  implementation, which is often a slightly different dialect. This has
					  happened hundreds if not thousands of times over. (Probably hundreds
				          of thousands or more if one counts all the people doing homework for
					  Scheme courses.) 
					  This happens for Scheme in a way that it doesn't for any other
					  language. Scheme has also served as a testbed for innovated language
					  ideas more than any other language, either by fueling such innovation
					  or by adopting such innovation. I'm talking about the most major
					  innovations of all of computer science. Things like: scoping,
					  nondeterminism, parallelism, lazy evaluation, unification, constraint
					  processing, stochastic computation, quantum computation, automatic
					  differentiation, genetic programming, types, automated reasoning,
					  ... just to name a few."))
                          (dl 
                              (di "Learning tests"
                                  (p "My own learning tests " (cite/a "testsuites/testsuite-learning-suite.html") 
				     " to understand the Scheme language, via the chicken interpreter."))
                              (di "Unittest framework"
				  (p "Bootstrapping a unit test framework, test-driven itself! " 
				     (cite/a "testsuites/testsuite-bootstrap-sut.html")))
                              (di "Auxiliary definitions" 
                                  (p "More to say...continuations..." (cite/a "testsuites/testsuite-auxtest.html")))
                              (di "The Hansei probabilistic language" 
				  (p "We present in " (cite/a "testsuites/testsuite-hanseitest.html") 
				     " a test suite to understand the system defined in the reference page " 
				     (cite/a "https://okmij.org/ftp/kakuritu/Hansei.html") ". Quoting author's words:")
                                  (cite/quote "Oleg Kiselyov"
                                              (i "HANSEI is the the embedded domain-specific language for probabilistic 
						  programming: for writing potentially infinite discrete-distribution models 
						  and performing exact inference, importance sampling and inference of inference.")))))))


#;(displaymath (frac (frac (m (x + 1)) (m 2)) (m 3)))


(SXML->HTML->file! tree "index")




