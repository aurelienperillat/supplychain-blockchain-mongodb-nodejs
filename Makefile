.PHONY: install
install: node_modules mongo

.PHONY: mongo
mongo:
	docker run -d -v mongodata:/data/db  -p 27017:27017 mongo

node_modules: package.json
	npm install

.PHONY: start
start: 
	node server.js

.PHONY: build
build:
	docker build -t poc/supplychain:latest .

.PHONY: deploy
deploy:
	docker-compose down
	docker-compose up -d

