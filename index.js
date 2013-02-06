var __      = require('underscore'),
    base    = require('./base-app.js'),
    App     = base.app,
    Command = base.command,
    Arg     = base.arg,
    Opt     = base.opt,
    cloud   = require('./cloudapp.js'),
    fs      = require('fs'),
    cp      = require('copy-paste'),
    cliff   = require('cliff');

//console.log(cloud.CloudApp);

// cloud.setCredentials("matthew.a.simo@gmail.com", "p0psicle");

var app = new App("cgifs");


// Update Command:
var update = new Command(
  "update",
  [],
  [
    new Opt(
      'verbose mode',
      '--verbose',
      ['-v'],
      'Displays more info'
    )
  ],
  'Refesh local list of known .gifs',
  ['up'],
  function(p){

  console.log(p);    

//    function getItems(x){
//
//      console.log(x);
//      if(pageCount === 15)
//        clearInterval(currentInterval);
//
//      console.log(pageCount - x);
//      cloud.getItems({page: pageCount, per_page: 4, deleted: 'false', type: 'image' }, passItems); 
//      pageCount += 1;
//    }
//
//    function passItems(x){
//      if (x.length > 0) {
//        __.each(x, function(n){
//          if(n.content_url.slice(-3) === 'gif'){
//            gifList.push(n);
//          }
//        });
//      } else {
//      }
//      console.log("Total items = " + gifList.length);
//      setTimeout(function(){ ee.emit("pingCloud");}, 1000);
//    }
//
//    function updateCache(gifs){
//      fs.writeFile('gifs.json', JSON.stringify(gifs, null, 2), function(err){
//        if(err)
//          throw err;
//        else
//          console.log("Gifs Updated...");
//      });
//    }
//
//    function checkCache(){
//      fs.readFile('gifs.json', function(err, data){
//        if(err) 
//          throw err;
//        else
//          return JSON.parse(data);
//      });
//    }
//
//
//    var pageCount = 1,
//        currentItems,
//        currentInterval,
//        gifList = [];
//
//  var EventEmitter = require('events').EventEmitter;
//  var ee = new EventEmitter();
//
//  var pageCompleted = function() {
//    cloud.getItems({page: pageCount, per_page: 4, deleted: 'false', type: 'image' }, passItems); 
//    console.log("Page #" + pageCount + " completed.");
//    pageCount += 1;
//  };
//
//  var callback_many = function() {
//    console.log("Let's keep calling me!");
//  };
//
//  ee.on("pingCloud", pageCompleted);
//
//  ee.emit("pingCloud");
//

  }
);


// List Command:
var list = new Command(
  "list",
  [ 
    new Arg(
      '<query>',
      '\\b[\\w\\d\\.-]+\\b',
      [],
      "Will list items matching the input string."
    )
  ],
  [
    new Opt(
      'verbose mode',
      '--verbose',
      ['-v'],
      'Displays items in verbose mode'
    )
  ],
  'List all the known local gifs',
  ['ls'],
  function(p){

    var isVerbose = false;
    if(p[1] === '-v' || p[1] === '--verbose'){
      isVerbose = true;
    }

    function displayList(list, args){

      var searchTerm, output;

      if(isVerbose) {
        searchTerm == '';
        output = [ ['ID', 'Views', 'Drop Name', 'Drop URL', 'Content URL'] ];
      } else {
        searchTerm = args[1] || '';
        output = [ ['Drop Name', 'Drop URL', 'Content URL'] ];
      }

      __.each(list, function(n){
        if(n.name.search(searchTerm) !== -1)
          pushToList(n, output);
      });

      var outputOpt = {};
      outputOpt.columnSpacing = 4;
      console.log( cliff.stringifyRows(output, ['blue', 'blue', 'blue', 'blue', 'blue'], outputOpt) );
    }

    function pushToList(item, theList){
      if(isVerbose){
        theList.push( [ item.id, item.view_counter, item.name, item.url, item.content_url ] );
      } else {
        theList.push( [ item.name, item.url, item.content_url ] );
      }
    }

    fs.readFile('gifs.json', function(err, data){
      if(err) 
        throw err;
      else
        displayList(JSON.parse(data), p);
    });
  }
);


// Copy Command:
var copy = new Command(
  "copy",
  [
    new Arg(
      '<gif name>',
      '\\b[\\w\\d\\.-]+\\b',
      [],
      "Matches a gif id to the regex of \\b[\\w\\d\\.-]+\\b"
    )
  ],
  [
    new Opt(
      'silent mode',
      '--silent',
      ['-s'],
      'Copy like a ninja'
    )
  ],
  'Copy a .gif to the system clipboard specified by name.',
  ['cp'],
  function(p){
    var isSilent = false;
    __.each(p, function(n){
      if(n === '-s' || n === '--silent')
        isSilent = true;
    });

    fs.readFile('gifs.json', function(err, data){
      if(err) {
        throw err;
      } else { // File read, let's look for our gif
        var matchedItem = null;
        __.each(JSON.parse(data), function(n){ // For each item in the list of gifs do:
          _item = n; // Save item object for later reference
          __.each(__.values(n), function(i){ // For each of this object's values do:
            if(i ===  p[1]){ // Check if it matches passed in item
              matchedItem = _item; // Assign the matching Drop object to matchedItem var
            }
          });
        });
        if(matchedItem === null) { // Check if anything was a match
          console.log("Copy failed, drop not found."); // If not, output error message
        } else { // Something was a match so,
          isSilent ? mode = '-s' : mode = '';
          cp.copy(matchedItem.content_url, mode); // Copy that shiz
          if(isSilent) return;
          console.log("Copying " + matchedItem.content_url); // Give copy confirmation
        }
      }
    });
  
  }
);

app.commands.push(update, list, copy);

module.exports = function(){
  app.run(process.argv.slice(2)); // Run the app, passing in args (minus "node" & app name)
}
