
docker:
	docker compose down && docker compose build && docker compose up

# Don't use the following outside a container!
index:
	csi -s index.scm
	cd rosini && csi -s ecce-homo.scm

format:
	scheme-indent -T 2 < index.scm > index.scm.tmp && mv index.scm.tmp index.scm


testsuites:
	rm ./hugo/content/testssui/*
	docker run --rm --entrypoint /bin/bash -v ./hugo/content/testssui:/home/ubuntu/out ghcr.io/massimo-nocentini/aux.scm:master -c "cp test-results/* out"