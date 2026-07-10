
serve:
	hugo serve -D --minify --gc

build:
	rm -rf ../docs
	rm -rf public/
	hugo --minify --gc
	mv public/ ../docs


import-test-suites:
	rm -rf ./test-suites/*
	docker run --rm --entrypoint /bin/bash -v ./test-suites:/home/ubuntu/out ghcr.io/massimo-nocentini/aux.scm:master -c "cp test-results/* out"