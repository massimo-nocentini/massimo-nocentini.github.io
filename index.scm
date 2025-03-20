
(import unittest)

(define tree (sxml-tree "Me" 
                        `(div (@ (class "w3-sidebar w3-light-grey w3-bar-block") 
                                 (style= "width:25%"))
                              (a (@ (href "bootstrap-sut.html") 
				    (class "w3-bar-item w3-button")) "Bootstrap"))
			`(div (@ (style "margin-left:25%"))
			      (p "some"))))

(SXML->file! tree "index")

