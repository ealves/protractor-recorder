# Protractor Recorder
A web interface to record interactions and export to Protractor.

# Demonstration

Example with more three interactions. This demo shows assertive with failure and success, after editing the value inside last action.  

![Alt Text](https://raw.githubusercontent.com/ealves/protractor-recorder/master/docs/demos/protractor-recorder-demostration.gif)

## Features

#### General options

- Base URL;
- Run speed;
- List of available drivers;

#### Record

- Clicks on elements;
- Send keys to inputs;
- Assertions with mouse selection;
- Mouse moves;
- Duplicate actions;
- Drag and drop actions to reorder;
- Run actions while recording with 'Run from here' option.

#### Export

- Selenium Address;
- Window maximize;
- Tests with login pages;

## Dependencies

- NodeJs 4.x;
- Npm 2.x;
- Bower 1.x;
- Gulp 3.x;
- Protractor 3.x.

## Getting Started

After install all dependencies successfully, clone this repository and change directory to 'protractor-recorder':

``` shell
$ git clone https://github.com/ealves/protractor-recorder.git
```
``` shell
$ cd protractor-recorder
```

Execute the following commands to install npm and bower dependencies to Protractor Recorder:

``` shell
$ npm install
```
``` shell
$ bower install
```

## Running Protractor Recorder

Now you will need run three different process, following the order:

#### #1 - Selenium Webdriver Manager

- First, check for new install or updates and start selenium with Protractor Webdriver Manager:

``` shell
$ webdriver-manager update
```
``` shell
$ webdriver-manager start
```

#### #2 - Node Server

- Node server is used to control the messages flow from socket, run:

``` shell
$ node server.js
```

#### #3 - Angular Material Interface

- Start the Angular Material web interface with sample example, run:

``` shell
$ gulp serve
```

## Usage

- Access http://localhost:3000;
- Enter a url base and click on 'Record' to start recording
- After end up your test flow on Selenium browser's session, click on 'Export' to export conf.js and spec.js inside folder public/exports.
- Click on 'Run' to see your test running with a new Selenium session.
