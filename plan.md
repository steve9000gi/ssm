Here's what's left to do, as of Sun Aug 9 2015:

- deployment
  - FIXME: ssm-backend service doesn't properly depend on postgresql-9.4
    service running. Could be a race condition there. Or maybe not, depending
    on the backend's exit code in such a case (a 0 exit code will, I think,
    trigger upstart to respawn the process).

- backend
  - bump version and update prod backend

- frontend
  - save map without one loaded (i.e. create new)
  - save map with one loaded (i.e. update existing)

- Needs input/decision from Steve
  - add save/load buttons (maybe replace current functionality?)
  - stretch goal: name field for each map
  - question: should admin users be able to save a map they don't own?
    - if not, is an alert popup sufficient for informing them of this error?

