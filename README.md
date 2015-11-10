# Protractor Recorder (Under Development)
A web interface to record users actions and export to Protractor.

## Getting Started

After clone this repository and installed Protractor, execute the following commands to install npm and bower dependencies.

``` shell
$ npm install
```

``` shell
$ bower install
```

#### Node Server

- The node server is used to control the messages flow from socket, on root folder execute:

``` shell
$ node server.js
```

#### Web Interface

- To start the Angular Material web interface execute:

``` shell
$ gulp serve
```

#### Webdriver Manager

- The Protractor Recorder use Selenium with webdriver manager, execute:

``` shell
$ webdriver-manager start
```

## Usage

- Access http://localhost:3000;
- Enter a url base and click on 'Record' to start recording
- After end up your test flow click on 'Export Protractor' to export each spec. 
