#!/bin/sh

export NODE_OPTIONS="--experimental-vm-modules"

# Forward all arguments to jest
yarn run jest "$@"