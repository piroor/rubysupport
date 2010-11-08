#!/bin/sh

appname=rubysupport

cp buildscript/makexpi.sh ./
./makexpi.sh $appname version=0
rm ./makexpi.sh

