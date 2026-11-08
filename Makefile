IMAGE ?= remotion-three-docker

.PHONY: build render still studio shell clean

build:
	docker build -t $(IMAGE) .

render:
	mkdir -p out
	docker run --rm -v "$(PWD)/out:/app/out" $(IMAGE)

still:
	mkdir -p out
	docker run --rm -v "$(PWD)/out:/app/out" $(IMAGE) npm run still

studio:
	mkdir -p out
	docker run --rm -it -p 3000:3000 -v "$(PWD)/src:/app/src" -v "$(PWD)/public:/app/public" -v "$(PWD)/out:/app/out" $(IMAGE) npx remotion studio src/index.ts --host=0.0.0.0 --port=3000

shell:
	docker run --rm -it -v "$(PWD)/out:/app/out" $(IMAGE) bash

clean:
	rm -rf out
