Here's what's left to do, as of Sun Aug 23 2015:

- deployment
  - FIXME: ssm-backend service doesn't properly depend on postgresql-9.4
    service running. Could be a race condition there. Or maybe not, depending
    on the backend's exit code in such a case (a 0 exit code will, I think,
    trigger upstart to respawn the process).

- backend

- frontend
  - stretch goal: name field for each map (pending input/UX from Steve)

