var __ = require("underscore");

commandProto = {
  name: 'Unknown',
  args: [],
  opts: [],
  help: '',
  handler: function(){}
}
function Command(name, args, opts, help, alias, fn){
  this.name = name;
  this.args = args;
  this.opts = opts;
  this.help = help;
  this.alias = alias;
  this.handler = fn;
};
Command.prototype = commandProto;


argProto = {
  name: 'Unknown Arg',
  code: '',
  alias: [],
  help: ''
}
function Arg(name, code, alias, help){
  this.name = name;
  this.code = code;
  this.alias = alias;
  this.help = help;
};
Arg.prototype = argProto;


var appProto = {
  name: '',
  commands: [],
  bindCommands: function(){
    var _this = this;
    __.each(this.commands, function(k, v){
      com = k.name;
      _this[com] = k.handler;
    });
  },
  run: function(args) {
    var _this = this;
    _this.bindCommands();
    if(_this.isCommand(_this, args[0])){
      var cmd = _this.getCommand(_this, args[0]);
      _this[cmd.name](args);
    } else {
      _this.help(args);
    }
  },
  isCommand: function(_app, commandName) {
    isCommand = false;
    __.each(_app.commands, function(n){ 
      if(n.name === commandName || __.contains(n.alias, commandName)) isCommand = true;
    });
    return isCommand;
  },
  getCommand: function(_app, commandName) {
    command = null;
    __.each(_app.commands, function(n){ 
      if(n.name === commandName || __.contains(n.alias, commandName)) command = n;
    });
    return command;
  }
}

function App(name){
  this.name = name;
  var _parent = this;
  this.commands.push(new Command(
    "help", 
    [
      new Arg(
        "<command>",
        _parent.commands,
        [],
        "Type a command to get more info."
      ),
      new Arg(
        "'all'",
        "\\ball\\b",
        [],
        "Display help for all bound commands."
      )
    ],
    [],
    "Display the help text", 
    [],
    function(p){

      var msg = '';

      function getCommand(_app, commandName){
        command = null;
        __.each(_app.commands, function(n){ 
          if(n.name === commandName) command = n; 
        });
        return command;
      }

      function getCommandHelp(command){
        
        var hMsg = "Command:\t" + command.name + "\n" +
                   "Usage:  \t" + _parent.name + " " + command.name + " [<args>] [<opts>]\n";

        // Output any Aliases
        if(command.alias.length > 0){
          hMsg += "Aliases: \t";
          __.each(command.alias, function(a){
            hMsg += "'" + a + "', ";
          });
          hMsg = hMsg.slice(0,-2);
          hMsg += "\n";
        }

        // Output any Arguments
        if(command.args.length > 0){
          hMsg += "Arguments:\n";
          __.each(command.args, function(k){
            hMsg += "  " + k.name + " \t" + k.help + "\n";
          });
        }

        // Output any Options
        if(command.opts.length > 0){
          hMsg += "Options:\n";
          __.each(command.opts, function(k){
            hMsg += "  " + k.code;
            __.each(k.alias, function(a){
              hMsg += ", " + a;
            });
            hMsg +=  "\n    " + k.name + ": " + k.help + "\n";
          });
        }
        return hMsg;
      }

      function getAppHelp(){
        // Output app wide help. e.g. list commands
        var hMsg = "Usage: " + _parent.name +" <command> [<args>] [<opts>]\n\n"+
                   "Commands:\n\n";
        __.each(_parent.commands, function(k){
          hMsg += "  " + k.name + "  \t" + k.help + "\n";
        });

        hMsg += "\nSee '"+_parent.name+" help <command>' for more information on a specific command.";
        return hMsg;
      }

      if(p[1] === 'all'){
        __.each(_parent.commands, function(n){
          msg += getCommandHelp(n);
          msg += "\n\n";
        });
      } else if (_parent.isCommand(_parent, p[1])){
        c = _parent.getCommand(_parent, p[1]);
        msg += getCommandHelp(c);
      } else { // first parameter after help isn't all || a command
        msg += getAppHelp();
      }

      console.log(msg);
    }
  ));
}
App.prototype = appProto;

module.exports.app = App;
module.exports.command = Command;
module.exports.arg = Arg;
module.exports.opt = Arg;
