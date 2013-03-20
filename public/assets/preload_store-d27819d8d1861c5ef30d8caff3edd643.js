/**
  We can insert data into the PreloadStore when the document is loaded.
  The data can be accessed once by a key, after which it is removed

  @class PreloadStore
**/
PreloadStore={data:{},store:function(e,t){this.data[e]=t},get:function(e,t){var n=this;return Ember.Deferred.promise(function(r){if(n.data[e])r.resolve(n.data[e]),delete n.data[e];else if(t){var i=t();i.then?i.then(function(e){return r.resolve(e)},function(e){return r.reject(e)}):r.resolve(i)}else r.resolve(null)})},contains:function(e){return this.data[e]!==void 0},getStatic:function(e){var t=this.data[e];return delete this.data[e],t}};