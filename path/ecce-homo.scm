
(import (aux sxml))

(define tree (sxml-tree '("Ecce Homo!" "don Fabio Rosini")
                        `((p "Trascritto della catechesi registrata "
			     (cite/a "https://www.youtube.com/watch?v=JHXtInDSlp0" 
				     "\"Ecce Homo!\": Settimana biblica 9-10 marzo 2017 presso la Parrocchia S. Lorenzo da Brindisi di Francavilla Fontana"))

                          )))


(SXML->HTML->file! tree "ecce-homo")




