Here's what's left to do, as of Sun Aug 9 2015:

- deployment
  - I can do `curl http://syssci.edc.renci.org:8080/ping` successfully, but
    only with the VPN connected.
    - So, might want to get RENCI staff involved here.
    - Another option would be to reverse proxy a virtual host, which I think
      would allow us to hook into the publicly exposed port 80. However, might
      still need RENCI staff support here for DNS name.
  - FIXME: ssm-backend service doesn't properly depend on postgresql-9.4
    service running. Could be a race condition there. Or maybe not, depending
    on the backend's exit code in such a case (a 0 exit code will, I think,
    trigger upstart to respawn the process).

- backend
  - add last-modified timestamp to database schema
  - update last-modified timestamp upon creation and update
  - when returning maps, return most-recently-modified first
  - admin users can load maps owned by others; regular users cannot

- frontend
  - upon click of either, test authentication
  - if unauth'd, prompt (maybe in modal lightbox) for creds
  - try authenticating, if fail, display error message and re-prompt
  - conditionally display email addresses in map list if returned from backend
  - do new user registration
  - when saving that map, should update rather than create if appropriate
  - upon page load, check URL and load map if fragment refers to one
    - should allow an intermediate authenticate step if needed
    - should strip fragment if authenticated user is not authorized to view

- Needs input/decision from Steve
  - add save/load buttons (maybe replace current functionality?)
  - stretch goal: name field for each map
  - question: should admin users be able to save a map they don't own?
    - if not, is an alert popup sufficient for informing them of this error?

