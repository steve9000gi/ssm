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
  - Also need a put method for updates

- frontend
  - add save/load buttons (maybe replace current functionality?)
  - upon click of either, test authentication
  - if unauth'd, prompt (maybe in modal lightbox) for creds
  - try authenticating, if fail, re-prompt
  - display list of documents to user, with links to load each
  - do new user registration
  - pull up list of maps when loading
  - each item in list has a link to open that map
  - when saving that map, should update rather than create

