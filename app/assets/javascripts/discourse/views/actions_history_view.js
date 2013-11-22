/**
  This view handles rendering of what actions have been taken on a post. It uses
  buffer rendering for performance rather than a template.

  @class ActionsHistoryComponent
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/
Discourse.ActionsHistoryComponent = Em.Component.extend({
  tagName: 'section',
  classNameBindings: [':post-actions', 'hidden'],
  actionsHistory: Em.computed.alias('post.actionsHistory'),
  emptyHistory: Em.computed.empty('actionsHistory'),
  hidden: Em.computed.and('emptyHistory', 'post.notDeleted'),
  shouldRerender: Discourse.View.renderIfChanged('actionsHistory.@each', 'actionsHistory.users.length', 'post.deleted'),

  // This was creating way too many bound ifs and subviews in the handlebars version.
  render: function(buffer) {

    if (!this.get('emptyHistory')) {
      this.get('actionsHistory').forEach(function(c) {
        buffer.push("<div class='post-action'>");

        var renderActionIf = function(property, dataAttribute, text) {
          if (!c.get(property)) { return; }
          buffer.push(" <a href='#' data-" + dataAttribute + "='" + c.get('id') + "'>" + text + "</a>.");
        };

        // TODO multi line expansion for flags
        var iconsHtml = "";
        if (c.get('usersExpanded')) {
          var postUrl;
          c.get('users').forEach(function(u) {
            iconsHtml += "<a href=\"" + Discourse.getURL("/users/") + (u.get('username_lower')) + "\">";
            if (u.post_url) {
              postUrl = postUrl || u.post_url;
            }
            iconsHtml += Discourse.Utilities.avatarImg({
              size: 'small',
              avatarTemplate: u.get('avatar_template'),
              title: u.get('username')
            });
            iconsHtml += "</a>";
          });

          var key = 'post.actions.people.' + c.get('actionType.name_key');
          if (postUrl) { key = key + "_with_url"; }

          buffer.push(" " + I18n.t(key, { icons: iconsHtml, postUrl: postUrl}) + ".");
        }
        renderActionIf('usersCollapsed', 'who-acted', c.get('description'));
        renderActionIf('canAlsoAction', 'act', I18n.t("post.actions.it_too." + c.get('actionType.name_key')));
        renderActionIf('can_undo', 'undo', I18n.t("post.actions.undo." + c.get('actionType.name_key')));
        renderActionIf('can_clear_flags', 'clear-flags', I18n.t("post.actions.clear_flags", { count: c.count }));

        buffer.push("</div>");
      });
    }

    var post = this.get('post');
    if (post.get('deleted')) {
      buffer.push("<div class='post-action'>" +
                  I18n.t("post.deleted_by") + " " +
                  Discourse.Utilities.tinyAvatar(post.get('postDeletedBy.avatar_template')) +
                  Discourse.Formatter.autoUpdatingRelativeAge(new Date(post.get('postDeletedAt'))) +
                  "</div>");
    }
  },

  actionTypeById: function(actionTypeId) {
    return this.get('actionsHistory').findProperty('id', actionTypeId);
  },

  click: function(e) {
    var $target = $(e.target),
        actionTypeId;

    if (actionTypeId = $target.data('clear-flags')) {
      this.actionTypeById(actionTypeId).clearFlags();
      return false;
    }

    // User wants to know who actioned it
    if (actionTypeId = $target.data('who-acted')) {
      this.actionTypeById(actionTypeId).loadUsers();
      return false;
    }

    if (actionTypeId = $target.data('act')) {
      this.get('actionsHistory').findProperty('id', actionTypeId).act();
      return false;
    }

    if (actionTypeId = $target.data('undo')) {
      this.get('actionsHistory').findProperty('id', actionTypeId).undo();
      return false;
    }

    return false;
  }
});


Discourse.View.registerHelper('discourse-action-history', Discourse.ActionsHistoryComponent);