# The site is built and deployed by .github/workflows/pages.yml on every push
# to master; these targets are for local work only.

serve:
	hugo serve -D --gc

# Production build into public/ (git-ignored), as the deploy workflow does it.
build:
	rm -rf public/
	hugo --gc --minify

import-test-suites:
	rm -rf ./test-suites/*
	docker run --rm --entrypoint /bin/bash -v ./test-suites:/home/ubuntu/out ghcr.io/massimo-nocentini/aux.scm:master -c "cp test-results/* out"

.PHONY: serve build import-test-suites
