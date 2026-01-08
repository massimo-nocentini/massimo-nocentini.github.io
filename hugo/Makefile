
serve:
	hugo serve -D --minify --gc

build:
	hugo -D --minify --gc
	rsync -a public/ ../
	rm -rf public
