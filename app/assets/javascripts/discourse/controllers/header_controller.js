/**
  This controller supports actions on the site header

  @class HeaderController
  @extends Discourse.Controller
  @namespace Discourse
  @module Discourse
**/
Discourse.HeaderController = Discourse.Controller.extend({
  topic: null,
  showExtraInfo: null,

  toggleStar: function() {
    var topic = this.get('topic');
    if (topic) topic.toggleStar();
    return false;
  }

});


