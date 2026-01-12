
serve:
	hugo serve -D --minify --gc

build:
	hugo --minify --gc
	rsync -a public/ ../
	rm -rf public
