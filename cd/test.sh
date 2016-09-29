#!/usr/bin/env bash


dir=$(dirname "$(which "$0")")
parentdir="$(dirname "$dir")"

echo ${dir}
echo ${parentdir}

#install alps dependencies
pushd "${parentdir}/alps_adaptor" >/dev/null 2>&1
npm install
popd >/dev/null 2>&1

#install mssql dependencies
pushd "${parentdir}/mssql_adaptor" >/dev/null 2>&1
npm install
popd >/dev/null 2>&1

#install client deps
pushd "${parentdir}/client" >/dev/null 2>&1
npm install --ignore-scripts
popd >/dev/null 2>&1


#install api dependencies
pushd "${parentdir}/api" >/dev/null 2>&1
npm install --
npm test
popd >/dev/null 2>&1
