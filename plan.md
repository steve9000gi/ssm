Here's what's left to do, as of Sun Aug 9 2015:

- deployment
  - FIXME: ssm-backend service doesn't properly depend on postgresql-9.4
    service running. Could be a race condition there. Or maybe not, depending
    on the backend's exit code in such a case (a 0 exit code will, I think,
    trigger upstart to respawn the process).

- backend
  - bump version and update prod backend
  - logout

- frontend
  - logout
  - when loading a map, add fragment corresponding to that map ID
  - when saving that map, check fragment and update if appropriate
  - upon page load, check URL and load map if fragment refers to one
    - should allow an intermediate authenticate step if needed
    - should strip fragment if authenticated user is not authorized to view

- Needs input/decision from Steve
  - add save/load buttons (maybe replace current functionality?)
  - stretch goal: name field for each map
  - question: should admin users be able to save a map they don't own?
    - if not, is an alert popup sufficient for informing them of this error?

