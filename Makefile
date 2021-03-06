SHELL := /bin/bash
PATH := node_modules/.bin:$(PATH)
ENV := development
NODE := node --harmony
GRUNT := $(NODE) ./node_modules/.bin/grunt --gruntfile make.js

.PHONY: all server build install clean clobber dist

all: server

server: install
	$(GRUNT) serve

_setenv-production:
	$(eval ENV :="production")

dist: clean install
	$(GRUNT) dist

clean:
	$(GRUNT) clean

install: node_modules

node_modules: package.json
	npm install
	touch $@


