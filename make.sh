#!/bin/sh

appname=rubysupport

cp buildscript/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh

