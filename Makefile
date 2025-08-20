
docker:
	docker compose down && docker compose build && docker compose up

# Don't use the following outside a container!
index:
	csi -s index.scm
	cd path && csi -s ecce-homo.scm

format:
	scheme-indent -T 2 < index.scm > index.scm.tmp && mv index.scm.tmp index.scm


