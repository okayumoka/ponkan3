#!/bin/bash
cd `dirname $0`
cd ../

echo CURRENT_UID=$CURRENT_UID
echo MANUAL=$MANUAL
echo WEBTEST=$WEBTEST

npm install

if [ "${MANUAL}" = "1" ] ; then
  tail -f /dev/null
else
  if [ "${WEBTEST}" = "1" ] ; then
    npm run start-test
  else
    npm start
  fi
fi

