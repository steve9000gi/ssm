# Development Workflow

The goals of the development workflow are:

* isolation, so that your local changes don't affect anybody else (and vice
  versa)
* automatic compilation of your changes in order to see your effects without
  intermediate build steps

We will discuss each topic in turn.

## Isolation of persistent changes

As a developer, you need to be confident that your development work will not
break the app for anybody else: you need isolation.

The way to do this is to start your own local backend process, which runs the
same code as what's running in production to support your main app.

This involves three processes: a database server, an API server, and a file
server. Also, you need to direct the frontend to talk to the API service that
you started, rather than the main production one.

### Start a local database server

We use PostgreSQL for this project. For a quick setup on a Mac, do the
following:

1. `brew install postgresql`
2. `cd <project_root>`
3. `initdb -D pg     # inits a PostgreSQL database in the 'pg' directory`
4. `postgres -ED pg  # starts a database server owned by the current user`
5. (in a new terminal window:)
6. `createdb ssm     # to create a new database for this project`
7. `psql -i backend/resources/schema.sql ssm  # to load the schema`

The cool part about this approach is that, because the database process is owned
by the current user rather than the superuser, you don't need to do any extra
steps to authenticate successfully.

(Note: I am writing this by memory. It's possible some of these commands are a
bit off. If so, please correct the instructions above and remove this note.)

### Start a local API server

In the `backend` directory, say `lein migrate` to apply database migrations. If
your shell can't find the `lein` command, you'll need to install
[Leiningen](http://leiningen.org/).

Next, also in the `backend` directory, say `lein repl`.

Once you're presented with a prompt, type `(go)` to start the backend process.
Note that you'll need to have a `postgres` process running for the backend to
connect to, otherwise the `(go)` function will fail.

If you have a `postgres` process running and the backend still can't connect to
it, make sure your database settings in `project.clj` are correct. If you setup
PostgreSQL according to the instructions in the last section, your username
should be the username of the user who owns the `postgres` process (e.g.
returned by the `whoami` command), and the password should be an empty string.

### Start a local file server

To make a long story short, because we're sending AJAX requests from our web
pages to the backend process, we have to use a static HTTP server to serve our
frontend content to the browser. A server that I like for this is Node's
[http-server](https://www.npmjs.com/package/http-server), but others exist. The
important thing is to serve files from the project root directory, and to pay
attention for which port the server is listening on. You'll point your browser
at `http://localhost:<PORT>/`, e.g. `http://localhost:8081`.

One note about the port. The backend by default listens on port 8080. If your
static HTTP server also tries to listen on port 8080, it will fail. So you might
want to point it at, say, port 8081 instead.

### Set backend location

The frontend needs to know the address of the backend server. If you skip this
step, you (a) don't actually need to setup a local backend process and (b) will
be using (and potentially modifying) the actual production database. This is a
useful tool, but also dangerous, so use at your own risk.

If you'd rather use your own local backend server, you'll need to edit the file
`js/backend.js`. Change the `backendBase` variable to be
`http://localhost:8080/`. Note that this change won't take effect, not even with
a browser refresh, unless you follow the next step.

## Automatic compilation of changes

There are essentially two closely related but separate projects in this
repository: the frontend, written in Javascript, HTML, and CSS, and the backend,
written in Clojure. I'll describe a development workflow for each project below.

### Frontend Development Workflow

No build steps were needed for the frontend code when I (Jeff) started on this
project. I'm introducing them deliberately. Here's why. When I started, there
was one monolithic Javascript file that had over 3,000 lines. I want to split
this up into several files for easier maintenance and development. One way of
doing this is just to include each file in the list of files included in the
`index.html` page. This is not ideal for several reasons:

1. Brittleness. Add or remove a file and forget to update `index.html`, and the
   app breaks.
2. Tedium. You need to load the files in dependency order, which can get tricky
   if you have more than a few files.
3. Performance. Fetching dozens of files over a network connection isn't nearly
   as efficient as fetching a handful, since each file fetched has overhead in
   terms of protocol negotiation and round-trip-times.

The solution I chose is to bundle all the scripts together into a single file
that inserts each file's code in dependency order, as determined by `require`
calls in the code. This system uses the same module system as node.js. If you
start a `watchify` process (see below), it will watch your files for changes
and rebuild the bundled file in a few milliseconds. Then just go to your
browser, hit refresh, and your changes are present in the newly loaded code.

#### Setup

Assuming you have node installed already, just install the `watchify` module:

    npm install -g watchify

#### Running

Whenever you're about to change any javascript files, start a `watchify`
process to watch the files for changes and rebuild the bundled script as
needed:

    watchify js/main.js -o bundled.js -v

### Backend Development Workflow

If, in the course of development, you need to change the backend server, all you
need to do is say `(reset)` in the REPL. If it reports a syntax error, just fix
it and say `(reset)` again. Worst case, you can restart the entire REPL process.

This isn't as automatic as the `watchify` process for the frontend, but it's
still pretty painless and fast.
