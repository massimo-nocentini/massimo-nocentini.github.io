
serve:
	hugo serve -D --minify --gc

build:
	rm -rf public/
	hugo --minify --gc
	rsync -a public/ ../docs
	rm -rf public/
