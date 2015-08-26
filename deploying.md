To deploy a new backend, see the instructions in the backend/ directory.

To deploy a new frontend, ssh to syssci, cd to `/var/www/html/ssm`, and treat
it like a normal git repository. Note that whatever pulls, merges, checkouts,
etc. you do in this directory are immediately visible by users, since the
directory is hosted by Apache.

My general advice is never to take the repository there off of the master
branch. In fact, I'd say all you really need to do there is a simple
`git pull`, then walk away. :-)

Note that we prevent the `.git` and `backend` directory, as well as any `*.md`
files, from being served via some directives in `/etc/httpd/conf/httpd.conf`.

Let me know if you have any questions or problems!

Jeff Terrell
jeff.terrell@acm.org
August 25, 2015

