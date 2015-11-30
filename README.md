# Protractor Recorder (Under Development)
A web interface to record users actions and export to Protractor.

## Dependencies

- NodeJs;
- Npm;
- Bower;
- Gulp;
- Protractor.

## Getting Started

After clone this repository and installed Protractor, execute the following commands to install npm and bower dependencies.

``` shell
$ npm install
```

``` shell
$ bower install
```

#### Node Server

- The node server is used to control the messages flow from socket, on root folder, run:

``` shell
$ node server.js
```

#### Web Interface

- To start the Angular Material web interface, run:

``` shell
$ gulp serve
```

#### Selenium

- To start the Selenium run:

``` shell
$ webdriver-manager start
```

## Usage

- Access http://localhost:3000;
- Enter a url base and click on 'Record' to start recording
- After end up your test flow click on 'Export Protractor' to export conf.js and spec.js inside the folder public/exports.
