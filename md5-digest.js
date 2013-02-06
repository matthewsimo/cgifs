(function() {
  var crypto, decodeDigest, encodeDigest, nc_counter, sys;

  sys = require("sys");

  crypto = require("crypto");

  decodeDigest = function(str) {
    var hash;
    hash = {};
    str.split(",").forEach(function(chunk) {
      var pair, part1;
      pair = chunk.split("=");
      if (pair.length > 1) {
        part1 = pair.shift().replace(/^(\s+|Digest\s+)/, "");
        return hash[part1] = pair.join("=").replace(/^"|"$/g, "");
      }
    });
    return hash;
  };

  encodeDigest = function(hash) {
    var exceptions, k, pairs;
    pairs = [];
    exceptions = ["charset", "algorithm", "qop", "nc"];
    for (k in hash) {
      if (exceptions.indexOf(k) > -1) {
        pairs.push(k + "=" + hash[k]);
      } else {
        pairs.push(k + "=\"" + hash[k] + "\"");
      }
    }
    return "Digest " + pairs.join(", ");
  };

  nc_counter = 0;

  exports.processing = function(str, params) {
    var cnonce, crypter, ha1, ha2, nc, res, response, ret;
    res = decodeDigest(str);
    cnonce = +(new Date);
    nc = String(++nc_counter);
    while (nc.length < 8) {
      nc = "0" + nc;
    }
    crypter = crypto.createHash("md5").update(params.username + ":").update(res.realm + ":").update(params.password);
    ha1 = crypter.digest("hex");
    ha2 = crypto.createHash("md5").update(params.method + ":" + params.uri).digest("hex");
    response = crypto.createHash("md5").update([ha1, res.nonce, nc, cnonce, res.qop, ha2].join(":")).digest("hex");
    ret = {
      username: params.username,
      realm: res.realm,
      nonce: res.nonce,
      uri: params.uri,
      qop: res.qop,
      nc: nc,
      cnonce: cnonce,
      response: response
    };
    if ((res != null ? res.opaque : void 0) != null) {
      ret.opaque = res.opaque;
    }
    return encodeDigest(ret);
  };

}).call(this);
