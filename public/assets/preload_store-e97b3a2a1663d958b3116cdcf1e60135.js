/**
  We can insert data into the PreloadStore when the document is loaded.
  The data can be accessed once by a key, after which it is removed

  @class PreloadStore
**/
PreloadStore={data:{},store:function(e,t){this.data[e]=t},get:function(e,t){var n=new RSVP.Promise;if(this.data[e])n.resolve(this.data[e]),delete this.data[e];else if(t){var r=t();r.then?r.then(function(e){return n.resolve(e)},function(e){return n.reject(e)}):n.resolve(r)}else n.resolve(null);return n},contains:function(e){return this.data[e]!==void 0},getStatic:function(e){var t=this.data[e];return delete this.data[e],t}};