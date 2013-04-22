/**
  A data model for summarizing actions a user has taken, for example liking a post.

  @class ActionSummary
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
Discourse.ActionSummary = Discourse.Model.extend({

  // Description for the action
  description: function() {
    var action = this.get('actionType.name_key');
    if (this.get('acted')) {
      if (this.get('count') <= 1) {
        return Em.String.i18n('post.actions.by_you.' + action);
      } else {
        return Em.String.i18n('post.actions.by_you_and_others.' + action, { count: this.get('count') - 1 });
      }
    } else {
      return Em.String.i18n('post.actions.by_others.' + action, { count: this.get('count') });
    }
  }.property('count', 'acted', 'actionType'),

  canAlsoAction: function() {
    if (this.get('hidden')) return false;
    return this.get('can_act');
  }.property('can_act', 'hidden'),

  // Remove it
  removeAction: function() {
    this.set('acted', false);
    this.set('count', this.get('count') - 1);
    this.set('can_act', true);
    return this.set('can_undo', false);
  },

  // Perform this action
  act: function(opts) {
    var action = this.get('actionType.name_key');

    // Mark it as acted
    this.set('acted', true);
    this.set('count', this.get('count') + 1);
    this.set('can_act', false);
    this.set('can_undo', true);

    if(action === 'notify_moderators' || action === 'notify_user') {
      this.set('can_undo',false);
      this.set('can_clear_flags',false);
    }

    // Add ourselves to the users who liked it if present
    if (this.present('users')) {
      this.users.pushObject(Discourse.get('currentUser'));
    }

    // Create our post action
    var actionSummary = this;

    return Discourse.ajax({
      url: Discourse.getURL("/post_actions"),
      type: 'POST',
      data: {
        id: this.get('post.id'),
        post_action_type_id: this.get('id'),
        message: (opts ? opts.message : void 0) || ""
      }
    }).then(null, function (error) {
      actionSummary.removeAction();
      var message = $.parseJSON(error.responseText).errors;
      bootbox.alert(message);
    });
  },

  // Undo this action
  undo: function() {
    this.removeAction();

    // Remove our post action
    return Discourse.ajax({
      url: Discourse.getURL("/post_actions/") + (this.get('post.id')),
      type: 'DELETE',
      data: {
        post_action_type_id: this.get('id')
      }
    });
  },

  clearFlags: function() {
    var actionSummary = this;
    return Discourse.ajax(Discourse.getURL("/post_actions/clear_flags"), {
      type: "POST",
      data: {
        post_action_type_id: this.get('id'),
        id: this.get('post.id')
      }
    }).then(function(result) {
      actionSummary.set('post.hidden', result.hidden);
      actionSummary.set('count', 0);
    });
  },

  loadUsers: function() {
    var actionSummary = this;
    Discourse.ajax(Discourse.getURL("/post_actions/users"), {
      data: {
        id: this.get('post.id'),
        post_action_type_id: this.get('id')
      }
    }).then(function (result) {
      var users = Em.A();
      actionSummary.set('users', users);
      result.each(function(u) {
        users.pushObject(Discourse.User.create(u));
      });
    });
  }
});
