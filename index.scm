
(import unittest)

(define tree (sxml-tree "Me" 
                        `((h1 "Personal projects")
                          (h2 "Scheme lang")
                          (dl (@ (class "w3-container"))
			      (di (cite/a "testsuites/testsuite-learning-suite.html" "Learning tests") 
				  (p "My own learning tests to understand the Scheme language, via the chicken interpreter."))
			      (di (cite/a "testsuites/testsuite-bootstrap-sut.html" "Unittest framework") 
				  (p "some comment"))
			      (di (cite/a "testsuites/testsuite-auxtest.html" "Auxiliary definitions") 
				  (p "some comment"))))))

(SXML->HTML->file! tree "index")

