#!/bin/bash

watchify js/main.js -o bundled.js -v &
postgres -ED backend/pg &
( cd backend ; lein run -m reloaded.repl/go ) &
lein simpleton 8081 &
trap "
  echo -e '\nSIGINT received; killing jobs';
  # kill everything in the current process group:
  /bin/kill -- -$$" SIGINT
wait
