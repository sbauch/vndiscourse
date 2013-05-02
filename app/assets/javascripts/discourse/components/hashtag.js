/**
  Helps us determine whether someone has been mentioned by looking up their userterm.

  @class Hahstag
  @termspace Discourse
  @module Discourse
**/
Discourse.Hashtag = (function() {
  var localCache = {};

  var cache = function(term, valid) {
    localCache[term] = valid;
  };

  var lookupCache = function(term) {
    return localCache[term];
  };

  var lookup = function(term, callback) {
    var cached = lookupCache(term);
    if (cached === true || cached === false) {
      callback(cached);
      return false;
    } else {
      Discourse.ajax(Discourse.getURL("/tags/valid"), { data: { term: term } }).then(function(r) {
        cache(term, r.valid);
        callback(r.valid);
      });
      return true;
    }
  };

  var load = function(e) {
    var $elem = $(e);
    if ($elem.data('hashtag-tested')) return;
    var term = $elem.text();
    var loading = lookup(term, function(valid) {
      if (valid) {
        return $elem.replaceWith("<a href='" + Discourse.getURL("/users/") + (userterm.toLowerCase()) + "' class='mention'>@" + userterm + "</a>");
      } else {
        return $elem.removeClass('mention-loading').addClass('mention-tested');
      }
    });
    if (loading) {
      return $elem.addClass('mention-loading');
    }
  };

  return { load: load, lookup: lookup, lookupCache: lookupCache };
})();


