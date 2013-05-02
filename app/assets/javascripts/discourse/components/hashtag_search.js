/**
  Helper for searching for Hashtags

  @class HashtagSearch
  @namespace Discourse
  @module Discourse
**/
var cache = {};
var cacheTopicId = null;
var cacheTime = null;

var debouncedSearch = Discourse.debouncePromise(function(term) {
  return Discourse.ajax({
    url: Discourse.getURL('/tags/search'),
    data: {
      term: term
    }
  }).then(function (r) {
    cache[term] = r;
    cacheTime = new Date();
    return r;
  });
}, 200);

Discourse.HashtagSearch = {

  search: function(options) {		
    var term = options.term || "";
  	var limit = options.limit || 5;
    var promise = Ember.Deferred.create();

    if ((new Date() - cacheTime) > 30000) {
      cache = {};
    }
    
    var success = function(r) {
      var result = [];
      r.tags.each(function(t) {
				result.push(t);
        if (result.length > limit) return false;
 				return true;
      });
      promise.resolve(result);
    };

    if (cache[term]) {
      success(cache[term]);
    } else {
      debouncedSearch(term).then(success);
    }
    return promise;
  }

};


