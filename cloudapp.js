
/*!
# node-cloudapp

bryn austin bellomy (`bryn.bellomy at gmail dot com`)

license: WTFPL, v2.
*/


(function() {
  var FormData, digest, fs, inspect, path, request, url,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  require("colors");

  fs = require("fs");

  url = require("url");

  path = require("path");

  request = require("request");

  digest = require("./md5-digest");

  FormData = require("form-data");

  inspect = require("util").inspect;

  /*!
  # CloudApp
  
  @class CloudApp
  @var username {String}
  @var password {String}
  */


  exports.CloudApp = (function() {

    CloudApp.prototype.username = "";

    CloudApp.prototype.password = "";

    CloudApp.prototype.authString = null;

    CloudApp.prototype.hasAuthorized = false;

    CloudApp.prototype.auth_digest = {};

    /*!
    ## CloudApp()
    
    @constructor
    @param username {String}
    @param password {String}
    */


    function CloudApp(username, password) {
      this.remove = __bind(this.remove, this);

      this.addFile = __bind(this.addFile, this);

      this.addBookmark = __bind(this.addBookmark, this);

      this.getItems = __bind(this.getItems, this);

      this.getInfo = __bind(this.getInfo, this);

      this.request = __bind(this.request, this);

      this.setAuthString = __bind(this.setAuthString, this);

      this.handleResponse = __bind(this.handleResponse, this);

      this.options = __bind(this.options, this);

      this.headers = __bind(this.headers, this);
      this.username = username;
      this.password = password;
    }

    /*!
    ## headers
    
    Create the headers object using our defaults plus whatever is passed in.
    
    @param headers {object}
    @param uri {object|String}
    */


    CloudApp.prototype.headers = function(headers, uri) {
      var defaults, hostAndPath, key, parsed_url, val, _i, _len, _ref;
      parsed_url = typeof uri === "object" ? uri : url.parse(uri);
      hostAndPath = parsed_url.host + parsed_url.pathname;
      if (headers == null) {
        headers = {};
      }
      defaults = {
        "accept": "application/json",
        "content-type": "application/json"
      };
      if (((_ref = this.auth_digest) != null ? _ref[hostAndPath] : void 0) != null) {
        defaults.authorization = this.auth_digest[hostAndPath];
      }
      for (val = _i = 0, _len = headers.length; _i < _len; val = ++_i) {
        key = headers[val];
        if (headers.hasOwnProperty(key)) {
          defaults[key] = val;
        }
      }
      return defaults;
    };

    /*!
    ## options
    
    Create the options object using our defaults plus whatever is passed in.
    
    @param options {object|String} Either the options object or a URL.
    */


    CloudApp.prototype.options = function(options) {
      var defaults, key, val;
      if (options == null) {
        options = {};
      }
      defaults = {};
      if (typeof options === "string") {
        options = {
          uri: options
        };
      }
      if (options.uri == null) {
        options.uri = options.url;
      }
      delete options.url;
      if (options.headers == null) {
        options.headers = {};
      }
      options.headers = this.headers(options.headers, options.uri);
      for (key in options) {
        val = options[key];
        if (options.hasOwnProperty(key)) {
          defaults[key] = val;
        }
      }
      return defaults;
    };

    /*!
    ## handleResponse
    
    Handle responses from requests created with @request.  Ensures that
    HTTP Digest authentication is done correctly, which is a mild pain.
    
    @param options {object}
    @param cb {Function} Takes params `err`, `response`, and `body`.
    */


    CloudApp.prototype.handleResponse = function(options, cb) {
      var _this = this;
      return function(err, response, body) {
        if (parseInt(response.statusCode, 10) === 401) {
          _this.setAuthString(response);
          return _this.request(options, cb);
        } else {
          return cb(err, response, body);
        }
      };
    };

    /*!
    ## setAuthString
    
    Sets the HTTP Digest hash string.
    
    @param response {object} From a @request.
    */


    CloudApp.prototype.setAuthString = function(response) {
      var hash, uri;
      uri = response.request.uri;
      hash = {
        username: this.username,
        password: this.password,
        uri: uri.pathname + (uri.search || ''),
        method: response.request.method
      };
      return this.auth_digest[uri.host + uri.pathname] = digest.processing(response.headers["www-authenticate"], hash);
    };

    /*!
    ## request
    
    Make a request.
    
    @param options {object|String} Follows the request module's API -- either options object or URL.
    @param cb {Function}
    */


    CloudApp.prototype.request = function(options, cb) {
      var innerCb,
        _this = this;
      innerCb = function(err, response, body) {
        if (typeof body === "string") {
          body = JSON.parse(body);
        }
        return cb(err, response, body);
      };
      return request(this.options(options), this.handleResponse(options, innerCb));
    };

    /*!
    ## getInfo
    
    Get info about a file on CloudApp.
    
    @param slug {String} The file's unique ID on CloudApp.
    @param cb {Function}
    */


    CloudApp.prototype.getInfo = function(slug, cb) {
      return this.request("http://cl.ly/" + slug, function(err, response, body) {
        if (err != null) {
          console.error("Error in CloudApp::getInfo ->".red, err.toString().red);
        }
        return cb(err, response, body);
      });
    };

    /*!
    ## getItems
    
    Get all of a user's items.
    
    @param params {object} A set of filter parameters.  See CloudApp API docs.
    @param cb {Function}
    */


    CloudApp.prototype.getItems = function(params, cb) {
      var options,
        _this = this;
      options = {
        url: "http://my.cl.ly/items",
        qs: params
      };
      return this.request(options, function(err, response, body) {
        if (err != null) {
          console.error("Error in CloudApp::getItems ->".red, err.toString().red);
        }
        return cb(err, response, body);
      });
    };

    /*!
    ## addBookmark
    
    Add a bookmark to CloudApp.
    
    @param name {String} Bookmark name.
    @param uri {String} Bookmark URI.
    @param cb {Function}
    */


    CloudApp.prototype.addBookmark = function(name, uri, cb) {
      var multipart, options, post_body, theRequest,
        _this = this;
      post_body = {
        item: {
          name: name != null ? name : uri,
          redirect_url: uri
        }
      };
      options = {
        uri: "http://my.cl.ly/items",
        method: "POST"
      };
      theRequest = this.request(options, function(err, response, body) {
        if (err != null) {
          console.error("Error in CloudApp::addBookmark ->".red, err.toString().red);
        }
        return cb(err, response, body);
      });
      multipart = theRequest.form();
      return multipart.append(JSON.stringify(post_body));
    };

    /*!
    ## addFile
    
    Upload a file to CloudApp.
    
    @param filename {String} Full path to the file in the local environment.
    @param cb {Function}
    */


    CloudApp.prototype.addFile = function(filename, cb) {
      var _this = this;
      return fs.stat(filename, function(err, stats) {
        if (err != null) {
          return cb(err);
        }
        if (!stats.isFile()) {
          return cb("Error in CloudApp::addFile -> Not a file: '" + filename + "'.");
        }
        return _this.request("http://my.cl.ly/items/new", function(err, response, body) {
          var contentLength, instructions, key, multipart, options, postToAmazon, theRequest, val;
          multipart = new FormData();
          instructions = (typeof body === "string" ? JSON.parse(body) : body);
          postToAmazon = instructions != null ? instructions.params : void 0;
          postToAmazon.key = postToAmazon.key.replace("${filename}", path.basename(filename));
          for (key in postToAmazon) {
            val = postToAmazon[key];
            multipart.append(key, val);
          }
          multipart.append("file", fs.readFileSync(filename));
          contentLength = multipart.getLengthSync();
          options = {
            uri: instructions.url,
            method: "POST",
            headers: {
              "Content-Length": contentLength
            }
          };
          theRequest = request.post(options, function(err, response, body) {
            if (response.statusCode === 303) {
              return _this.request(response.headers.location, cb);
            } else {
              return cb(err, response, body);
            }
          });
          multipart = theRequest.form();
          for (key in postToAmazon) {
            val = postToAmazon[key];
            multipart.append(key, val);
          }
          return multipart.append("file", fs.readFileSync(filename));
        });
      });
    };

    /*!
    ## remove
    
    Remove something on CloudApp.
    
    @param slug {String} The file's unique ID on CloudApp.
    @param cb {Function}
    */


    CloudApp.prototype.remove = function(slug, cb) {
      var options,
        _this = this;
      options = this.options({
        uri: "http://my.cl.ly/" + slug,
        method: "DELETE"
      });
      return this.request(options, function(err, response, body) {
        if (err != null) {
          console.error("Error in CloudApp::remove ->".red, err.toString().red);
        }
        return cb(err, response, body);
      });
    };

    return CloudApp;

  })();

}).call(this);
