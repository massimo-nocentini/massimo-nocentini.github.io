
index:
	csi -s index.scm
	cd path && csi -s ecce-homo.scm

format:
	scheme-indent -T 2 < index.scm > index.scm.tmp && mv index.scm.tmp index.scm

docker:
	docker compose down && docker compose build && docker compose up

