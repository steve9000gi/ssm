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

We use PostgreSQL for this project. Instructions are forthcoming. (TODO)

### Start a local API server

TODO

### Start a local file server

TODO

### Set backend location

TODO

## Automatic compilation of changes

No build steps were needed when I (Jeff) started on this project. I'm
introducing them deliberately. Here's why. When I started, there was one
monolithic Javascript file that had over 3k lines. I want to split this up into
several files. One way of doing this is just to include each file in the list
of files included in the index.html page. This is not ideal for a couple of
reasons:

1. Brittleness. Add or remove a file and forget to update index.html and the
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
and rebuild the bundled file in a matter of milliseconds. Then just go to your
browser, hit refresh, and your changes are present in the newly loaded code.

### Setup

Assuming you have node installed already, just install the `watchify` module:

    npm install -g watchify

### Running

Whenever you're about to change any javascript files, start a `watchify`
process to watch the files for changes and rebuild the bundled script as
needed:

    watchify systemsupportmap.js -o bundled.js -v

