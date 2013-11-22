/**
  This controller handles actions related to a user's invitations

  @class UserInvitedController
  @extends Ember.ArrayController
  @namespace Discourse
  @module Discourse
**/
Discourse.UserInvitedController = Ember.ArrayController.extend({

  /**
    Observe the search term box with a debouncer and change the results.

    @observes searchTerm
  **/
  _searchTermChanged: Discourse.debounce(function() {
    var self = this;
    Discourse.Invite.findInvitedBy(self.get('user'), this.get('searchTerm')).then(function (invites) {
      self.set('model', invites);
    });
  }, 250).observes('searchTerm'),

  /**
    The maximum amount of invites that will be displayed in the view

    @property maxInvites
  **/
  maxInvites: function() {
    return Discourse.SiteSettings.invites_shown;
  }.property(),

  /**
    Can the currently logged in user invite users to the site

    @property canInviteToForum
  **/
  canInviteToForum: function() {
    return Discourse.User.currentProp('can_invite_to_forum');
  }.property(),

  /**
    Should the search filter input box be displayed?

    @property showSearch
  **/
  showSearch: function() {
    if (Em.isNone(this.get('searchTerm')) && this.get('model.length') === 0) { return false; }
    return true;
  }.property('searchTerm', 'model.length'),

  /**
    Were the results limited by our `maxInvites`

    @property truncated
  **/
  truncated: function() {
    return this.get('model.length') === Discourse.SiteSettings.invites_shown;
  }.property('model.length'),

  actions: {

    /**
      Rescind a given invite

      @method rescive
      @param {Discourse.Invite} invite the invite to rescind.
    **/
    rescind: function(invite) {
      invite.rescind();
      return false;
    }
  }

});


