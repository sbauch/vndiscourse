/**
  This controller handles general user actions

  @class UserController
  @extends Discourse.ObjectController
  @namespace Discourse
  @module Discourse
**/
Discourse.UserController = Discourse.ObjectController.extend({

  viewingSelf: (function() {
    return this.get('content.username') === Discourse.get('currentUser.username');
  }).property('content.username', 'Discourse.currentUser.username'),

  canSeePrivateMessages: (function() {
    return this.get('viewingSelf') || Discourse.get('currentUser.admin');
  }).property('viewingSelf', 'Discourse.currentUser')

});


