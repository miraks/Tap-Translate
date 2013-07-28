#!/bin/bash

compile_coffee () {
  coffee -bc bootstrap.coffee
}

APP_NAME="taptranslate"
CHROME_PROVIDERS="content locale"
CLEAN_UP=1
ROOT_FILES="bootstrap.js bootstrap.coffee icon.png icon64.png"
ROOT_DIRS=
BEFORE_BUILD=compile_coffee
AFTER_BUILD=
PUSH_TO_DEVICE=1
ANDROID_APP_ID=org.mozilla.firefox
