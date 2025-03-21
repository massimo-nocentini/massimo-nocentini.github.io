
(import unittest)

(define personal-tree 
  `((h1 "Me")
    (p "This site is a collection of " (em "Massimo Nocentini") "'s papers, notes, memos and source code.")
    (h2 "Contacts")
    (ul (@ (class "w3-card w3-round"))
        (li (em "+39 320 1162059 (mobile)"))
        (li (cite/a "mailto:Massimo Nocentini <massimo.nocentini@gmail.com>" (code "massimo.nocentini@gmail.com")) " (personal)")
        (li (cite/a "mailto:Massimo Nocentini <massimo.nocentini@unifi.it>" (code "massimo.nocentini@unifi.it")) " (institutional)")
        (li (cite/a "https://github.com/massimo-nocentini/" (code "https://github.com/massimo-nocentini")) " (code)")
        (li (cite/a "https://raw.githubusercontent.com/massimo-nocentini/massimo-nocentini.github.io/master/id_rsa.pub" "Public RSA key"))
        (li (i (code "massimo.nocentini#9519")) " (Discord id)"))))

(define tree (sxml-tree "Me" 
                        `(,@personal-tree
			  (h1 "Personal projects")
                          (h2 "Scheme lang")
                          (dl (@ (class "w3-container"))
                              (di (cite/a "testsuites/testsuite-learning-suite.html" "Learning tests") 
                                  (p "My own learning tests to understand the Scheme language, via the chicken interpreter."))
                              (di (cite/a "testsuites/testsuite-bootstrap-sut.html" "Unittest framework") 
                                  (p "some comment"))
                              (di (cite/a "testsuites/testsuite-auxtest.html" "Auxiliary definitions") 
                                  (p "some comment"))
			      (di (cite/a "testsuites/testsuite-hanseitest.html" "The Hansei probabilistic language") 
				  (p "The reference page is by " (cite/a "https://okmij.org/ftp/kakuritu/Hansei.html" "Oleg") ", in his words:"
				     (blockquote (@ (class "w3-container w3-card w3-round w3-light-gray")) 
						 #;(span (& "#10077"))
						 (i "HANSEI is the the embedded domain-specific language for probabilistic 
						    programming: for writing potentially infinite discrete-distribution models 
						    and performing exact inference, importance sampling and inference of inference."))))))))

(SXML->HTML->file! tree "index")


