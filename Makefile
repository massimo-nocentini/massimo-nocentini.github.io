
build:
	csi -s index.scm
	cd path && csi -s ecce-homo.scm

docker:
	docker compose up