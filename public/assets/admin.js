(function () {

var $ = window.jQuery;

/**
  This controller supports interface for creating custom CSS skins in Discourse.

  @class AdminCustomizeController    
  @extends Ember.Controller
  @namespace Discourse
  @module Discourse
**/
 
Discourse.AdminCustomizeController = Ember.Controller.extend({

  /**
    Create a new customization style

    @method newCustomization
  **/
  newCustomization: function() {
    var item = Discourse.SiteCustomization.create({name: 'New Style'});
    this.get('content').pushObject(item);
    this.set('content.selectedItem', item);
  },

  /**
    Select a given style

    @method selectStyle
    @param {Discourse.SiteCustomization} style The style we are selecting
  **/
  selectStyle: function(style) {
    this.set('content.selectedItem', style);
  },

  /**
    Save the current customization

    @method save
  **/
  save: function() {
    this.get('content.selectedItem').save();
  },

  /**
    Destroy the current customization

    @method destroy
  **/
  destroy: function() {
    var _this = this;
    return bootbox.confirm(Em.String.i18n("admin.customize.delete_confirm"), Em.String.i18n("no_value"), Em.String.i18n("yes_value"), function(result) {
      var selected;
      if (result) {
        selected = _this.get('content.selectedItem');
        selected["delete"]();
        _this.set('content.selectedItem', null);
        return _this.get('content').removeObject(selected);
      }
    });
  }

});


})(this);(function () {

var $ = window.jQuery;

/**
  This controller supports the default interface when you enter the admin section.

  @class AdminDashboardController
  @extends Ember.Controller
  @namespace Discourse
  @module Discourse  
**/

Discourse.AdminDashboardController = Ember.Controller.extend({
  loading: true,
  versionCheck: null
});


})(this);(function () {

var $ = window.jQuery;

/**
  This controller supports the interface for reviewing email logs.

  @class AdminEmailLogsController    
  @extends Ember.ArrayController
  @namespace Discourse
  @module Discourse
**/
 
Discourse.AdminEmailLogsController = Ember.ArrayController.extend(Discourse.Presence, {
  
  /**
    Is the "send test email" button disabled?

    @property sendTestEmailDisabled
  **/    
  sendTestEmailDisabled: (function() {
    return this.blank('testEmailAddress');
  }).property('testEmailAddress'),

  /**
    Sends a test email to the currently entered email address

    @method sendTestEmail
  **/
  sendTestEmail: function() {
    var _this = this;
    _this.set('sentTestEmail', false);
    jQuery.ajax({
      url: '/admin/email_logs/test',
      type: 'POST',
      data: { email_address: this.get('testEmailAddress') },
      success: function() {
        return _this.set('sentTestEmail', true);
      }
    });
    return false;
  }
  
});


})(this);(function () {

var $ = window.jQuery;

/**
  This controller supports the interface for dealing with flags in the admin section.

  @class AdminFlagsController    
  @extends Ember.Controller
  @namespace Discourse
  @module Discourse
**/
 
Discourse.AdminFlagsController = Ember.Controller.extend({
  
  /**
    Clear all flags on a post

    @method clearFlags
    @param {Discourse.FlaggedPost} item The post whose flags we want to clear
  **/
  clearFlags: function(item) {
    var _this = this;
    item.clearFlags().then((function() {
      _this.content.removeObject(item);
    }), (function() {
      bootbox.alert("something went wrong");
    }));
  },

  /**
    Deletes a post

    @method deletePost
    @param {Discourse.FlaggedPost} item The post to delete
  **/
  deletePost: function(item) {
    var _this = this;
    item.deletePost().then((function() {
      _this.content.removeObject(item);
    }), (function() {
      bootbox.alert("something went wrong");
    }));
  },

  /**
    Are we viewing the 'old' view?

    @property adminOldFlagsView
  **/
  adminOldFlagsView: (function() {
    return this.query === 'old';
  }).property('query'),

  /**
    Are we viewing the 'active' view?

    @property adminActiveFlagsView
  **/
  adminActiveFlagsView: (function() {
    return this.query === 'active';
  }).property('query')
  
});


})(this);(function () {

var $ = window.jQuery;

/**
  This controller supports the interface for SiteSettings.

  @class AdminSiteSettingsController
  @extends Ember.ArrayController
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminSiteSettingsController = Ember.ArrayController.extend(Discourse.Presence, {
  filter: null,
  onlyOverridden: false,

  /**
    The list of settings based on the current filters

    @property filteredContent
  **/
  filteredContent: (function() {

    // If we have no content, don't bother filtering anything
    if (!this.present('content')) return null;

    var filter;
    if (this.get('filter')) {
      filter = this.get('filter').toLowerCase();
    }

    var adminSettingsController = this;
    return this.get('content').filter(function(item, index, enumerable) {
      if (adminSettingsController.get('onlyOverridden') && !item.get('overridden')) return false;
      if (filter) {
        if (item.get('setting').toLowerCase().indexOf(filter) > -1) return true;
        if (item.get('description').toLowerCase().indexOf(filter) > -1) return true;
        if (item.get('value').toLowerCase().indexOf(filter) > -1) return true;
        return false;
      }

      return true;
    });
  }).property('filter', 'content.@each', 'onlyOverridden'),

  /**
    Reset a setting to its default value

    @method resetDefault
    @param {Discourse.SiteSetting} setting The setting we want to revert
  **/
  resetDefault: function(setting) {
    setting.set('value', setting.get('default'));
    setting.save();
  },

  /**
    Save changes to a site setting

    @method save
    @param {Discourse.SiteSetting} setting The setting we've changed
  **/
  save: function(setting) {
    setting.save();
  },

  /**
    Cancel changes to a site setting

    @method cancel
    @param {Discourse.SiteSetting} setting The setting we've changed but want to revert
  **/
  cancel: function(setting) {
    setting.resetValue();
  }

});


})(this);(function () {

var $ = window.jQuery;

/**
  This controller supports the interface for listing users in the admin section.

  @class AdminUsersListController    
  @extends Ember.ArrayController
  @namespace Discourse
  @module Discourse
**/
  
Discourse.AdminUsersListController = Ember.ArrayController.extend(Discourse.Presence, {
  username: null,
  query: null,
  selectAll: false,
  content: null,

  /**
    Triggered when the selectAll property is changed

    @event selectAll
  **/
  selectAllChanged: (function() {
    var _this = this;
    this.get('content').each(function(user) {
      user.set('selected', _this.get('selectAll'));
    });
  }).observes('selectAll'),

  /**
    Triggered when the username filter is changed

    @event filterUsers
  **/
  filterUsers: Discourse.debounce(function() {
    this.refreshUsers();
  }, 250).observes('username'),

  /**
    Triggered when the order of the users list is changed

    @event orderChanged
  **/
  orderChanged: (function() {
    this.refreshUsers();
  }).observes('query'),

  /**
    Do we want to show the approval controls?

    @property showApproval
  **/
  showApproval: (function() {
    if (!Discourse.SiteSettings.must_approve_users) return false;
    if (this.get('query') === 'new') return true;
    if (this.get('query') === 'pending') return true;
  }).property('query'),

  /**
    How many users are currently selected

    @property selectedCount
  **/
  selectedCount: (function() {
    if (this.blank('content')) return 0;
    return this.get('content').filterProperty('selected').length;
  }).property('content.@each.selected'),

  /**
    Do we have any selected users?

    @property hasSelection
  **/
  hasSelection: (function() {
    return this.get('selectedCount') > 0;
  }).property('selectedCount'),

  /**
    Refresh the current list of users.

    @method refreshUsers
  **/
  refreshUsers: function() {
    this.set('content', Discourse.AdminUser.findAll(this.get('query'), this.get('username')));
  },


  /**
    Show the list of users.

    @method show
  **/
  show: function(term) {
    if (this.get('query') === term) {
      this.refreshUsers();
      return;
    }
    this.set('query', term);
  },

  /**
    Approve all the currently selected users.

    @method approveUsers
  **/
  approveUsers: function() {
    Discourse.AdminUser.bulkApprove(this.get('content').filterProperty('selected'));
  }
  
});


})(this);(function () {

var $ = window.jQuery;

/**
  Our data model for dealing with users from the admin section.

  @class AdminUser    
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
 
Discourse.AdminUser = Discourse.Model.extend({
  
  deleteAllPosts: function() {
    this.set('can_delete_all_posts', false);
    jQuery.ajax("/admin/users/" + (this.get('id')) + "/delete_all_posts", {type: 'PUT'});
  },

  // Revoke the user's admin access
  revokeAdmin: function() {
    this.set('admin', false);
    this.set('can_grant_admin', true);
    this.set('can_revoke_admin', false);
    return jQuery.ajax("/admin/users/" + (this.get('id')) + "/revoke_admin", {type: 'PUT'});
  },

  grantAdmin: function() {
    this.set('admin', true);
    this.set('can_grant_admin', false);
    this.set('can_revoke_admin', true);
    jQuery.ajax("/admin/users/" + (this.get('id')) + "/grant_admin", {type: 'PUT'});
  },

  // Revoke the user's moderation access
  revokeModeration: function() {
    this.set('moderator', false);
    this.set('can_grant_moderation', true);
    this.set('can_revoke_moderation', false);
    return jQuery.ajax("/admin/users/" + (this.get('id')) + "/revoke_moderation", {type: 'PUT'});
  },

  grantModeration: function() {
    this.set('moderator', true);
    this.set('can_grant_moderation', false);
    this.set('can_revoke_moderation', true);
    jQuery.ajax("/admin/users/" + (this.get('id')) + "/grant_moderation", {type: 'PUT'});
  },

  refreshBrowsers: function() {
    jQuery.ajax("/admin/users/" + (this.get('id')) + "/refresh_browsers", {type: 'POST'});
    bootbox.alert("Message sent to all clients!");
  },

  approve: function() {
    this.set('can_approve', false);
    this.set('approved', true);
    this.set('approved_by', Discourse.get('currentUser'));
    jQuery.ajax("/admin/users/" + (this.get('id')) + "/approve", {type: 'PUT'});
  },

  username_lower: (function() {
    return this.get('username').toLowerCase();
  }).property('username'),

  trustLevel: (function() {
    return Discourse.get('site.trust_levels').findProperty('id', this.get('trust_level'));
  }).property('trust_level'),

  canBan: (function() {
    return !this.admin && !this.moderator;
  }).property('admin', 'moderator'),

  banDuration: (function() {
    var banned_at, banned_till;
    banned_at = Date.create(this.banned_at);
    banned_till = Date.create(this.banned_till);
    return "" + (banned_at.short()) + " - " + (banned_till.short());
  }).property('banned_till', 'banned_at'),

  ban: function() {
    var duration,
      _this = this;
    if (duration = parseInt(window.prompt(Em.String.i18n('admin.user.ban_duration')), 10)) {
      if (duration > 0) {
        return jQuery.ajax("/admin/users/" + this.id + "/ban", {
          type: 'PUT',
          data: {duration: duration},
          success: function() {
            window.location.reload();
          },
          error: function(e) {
            var error;
            error = Em.String.i18n('admin.user.ban_failed', {
              error: "http: " + e.status + " - " + e.body
            });
            bootbox.alert(error);
          }
        });
      }
    }
  },

  unban: function() {
    var _this = this;
    return jQuery.ajax("/admin/users/" + this.id + "/unban", {
      type: 'PUT',
      success: function() {
        window.location.reload();
      },
      error: function(e) {
        var error;
        error = Em.String.i18n('admin.user.unban_failed', {
          error: "http: " + e.status + " - " + e.body
        });
        bootbox.alert(error);
      }
    });
  },

  impersonate: function() {
    var _this = this;
    return jQuery.ajax("/admin/impersonate", {
      type: 'POST',
      data: {
        username_or_email: this.get('username')
      },
      success: function() {
        document.location = "/";
      },
      error: function(e) {
        _this.set('loading', false);
        if (e.status === 404) {
          return bootbox.alert(Em.String.i18n('admin.impersonate.not_found'));
        } else {
          return bootbox.alert(Em.String.i18n('admin.impersonate.invalid'));
        }
      }
    });
  }

});

window.Discourse.AdminUser.reopenClass({

  bulkApprove: function(users) {
    users.each(function(user) {
      user.set('approved', true);
      user.set('can_approve', false);
      return user.set('selected', false);
    });
    return jQuery.ajax("/admin/users/approve-bulk", {
      type: 'PUT',
      data: {
        users: users.map(function(u) {
          return u.id;
        })
      }
    });
  },

  find: function(username) {
    var promise;
    promise = new RSVP.Promise();
    jQuery.ajax({
      url: "/admin/users/" + username,
      success: function(result) {
        return promise.resolve(Discourse.AdminUser.create(result));
      }
    });
    return promise;
  },

  findAll: function(query, filter) {
    var result;
    result = Em.A();
    jQuery.ajax({
      url: "/admin/users/list/" + query + ".json",
      data: {
        filter: filter
      },
      success: function(users) {
        return users.each(function(u) {
          return result.pushObject(Discourse.AdminUser.create(u));
        });
      }
    });
    return result;
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Our data model for representing an email log.

  @class EmailLog    
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
 
Discourse.EmailLog = Discourse.Model.extend({});

Discourse.EmailLog.reopenClass({
  create: function(attrs) {
    if (attrs.user) {
      attrs.user = Discourse.AdminUser.create(attrs.user);
    }
    return this._super(attrs);
  },

  findAll: function(filter) {
    var result;
    result = Em.A();
    jQuery.ajax({
      url: "/admin/email_logs.json",
      data: { filter: filter },
      success: function(logs) {
        logs.each(function(log) {
          result.pushObject(Discourse.EmailLog.create(log));
        });
      }
    });
    return result;
  }
});




})(this);(function () {

var $ = window.jQuery;

/**
  Our data model for interacting with flagged posts.

  @class FlaggedPost    
  @extends Discourse.Post
  @namespace Discourse
  @module Discourse
**/
 
Discourse.FlaggedPost = Discourse.Post.extend({

  flaggers: (function() {
    var r,
      _this = this;
    r = [];
    this.post_actions.each(function(a) {
      return r.push(_this.userLookup[a.user_id]);
    });
    return r;
  }).property(),

  messages: (function() {
    var r,
      _this = this;
    r = [];
    this.post_actions.each(function(a) {
      if (a.message) {
        return r.push({
          user: _this.userLookup[a.user_id],
          message: a.message
        });
      }
    });
    return r;
  }).property(),

  lastFlagged: (function() {
    return this.post_actions[0].created_at;
  }).property(),

  user: (function() {
    return this.userLookup[this.user_id];
  }).property(),

  topicHidden: (function() {
    return this.get('topic_visible') === 'f';
  }).property('topic_hidden'),

  deletePost: function() {
    var promise;
    promise = new RSVP.Promise();
    if (this.get('post_number') === "1") {
      return jQuery.ajax("/t/" + this.topic_id, {
        type: 'DELETE',
        cache: false,
        success: function() {
          promise.resolve();
        },
        error: function(e) {
          promise.reject();
        }
      });
    } else {
      return jQuery.ajax("/posts/" + this.id, {
        type: 'DELETE',
        cache: false,
        success: function() {
          promise.resolve();
        },
        error: function(e) {
          promise.reject();
        }
      });
    }
  },

  clearFlags: function() {
    var promise;
    promise = new RSVP.Promise();
    jQuery.ajax("/admin/flags/clear/" + this.id, {
      type: 'POST',
      cache: false,
      success: function() {
        promise.resolve();
      },
      error: function(e) {
        promise.reject();
      }
    });
    return promise;
  },

  hiddenClass: (function() {
    if (this.get('hidden') === "t") return "hidden-post";
  }).property()

});

Discourse.FlaggedPost.reopenClass({
  findAll: function(filter) {
    var result;
    result = Em.A();
    jQuery.ajax({
      url: "/admin/flags/" + filter + ".json",
      success: function(data) {
        var userLookup;
        userLookup = {};
        data.users.each(function(u) {
          userLookup[u.id] = Discourse.User.create(u);
        });
        return data.posts.each(function(p) {
          var f;
          f = Discourse.FlaggedPost.create(p);
          f.userLookup = userLookup;
          return result.pushObject(f);
        });
      }
    });
    return result;
  }
});




})(this);(function () {

var $ = window.jQuery;

Discourse.Report = Discourse.Model.extend({});

Discourse.Report.reopenClass({
  find: function(type) {
    var model = Discourse.Report.create();
    jQuery.ajax("/admin/reports/" + type, {
      type: 'GET',
      success: function(json) {
        model.mergeAttributes(json.report);
        model.set('loaded', true);
      }
    });
    return(model);
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Our data model for interacting with site customizations.

  @class SiteCustomization    
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
 
Discourse.SiteCustomization = Discourse.Model.extend({
  trackedProperties: ['enabled', 'name', 'stylesheet', 'header', 'override_default_style'],

  init: function() {
    this._super();
    return this.startTrackingChanges();
  },
 
  description: (function() {
    return "" + this.name + (this.enabled ? ' (*)' : '');
  }).property('selected', 'name'),

  changed: (function() {
    var _this = this;
    if (!this.originals) {
      return false;
    }
    return this.trackedProperties.any(function(p) {
      return _this.originals[p] !== _this.get(p);
    });
  }).property('override_default_style', 'enabled', 'name', 'stylesheet', 'header', 'originals'),

  startTrackingChanges: function() {
    var _this = this;
    this.set('originals', {});
    return this.trackedProperties.each(function(p) {
      _this.originals[p] = _this.get(p);
      return true;
    });
  },

  previewUrl: (function() {
    return "/?preview-style=" + (this.get('key'));
  }).property('key'),

  disableSave: (function() {
    return !this.get('changed');
  }).property('changed'),

  save: function() {
    var data;
    this.startTrackingChanges();
    data = {
      name: this.name,
      enabled: this.enabled,
      stylesheet: this.stylesheet,
      header: this.header,
      override_default_style: this.override_default_style
    };
    return jQuery.ajax({
      url: "/admin/site_customizations" + (this.id ? '/' + this.id : ''),
      data: {
        site_customization: data
      },
      type: this.id ? 'PUT' : 'POST'
    });
  },

  "delete": function() {
    if (!this.id) return;
    
    return jQuery.ajax({
      url: "/admin/site_customizations/" + this.id,
      type: 'DELETE'
    });
  }

});

var SiteCustomizations = Ember.ArrayProxy.extend({
  selectedItemChanged: (function() {
    var selected;
    selected = this.get('selectedItem');
    return this.get('content').each(function(i) {
      return i.set('selected', selected === i);
    });
  }).observes('selectedItem')
});

Discourse.SiteCustomization.reopenClass({
  findAll: function() {
    var content,
      _this = this;
    content = SiteCustomizations.create({
      content: [],
      loading: true
    });
    jQuery.ajax({
      url: "/admin/site_customizations",
      dataType: "json",
      success: function(data) {
        if (data) {
          data.site_customizations.each(function(c) {
            var item;
            item = Discourse.SiteCustomization.create(c);
            return content.pushObject(item);
          });
        }
        return content.set('loading', false);
      }
    });
    return content;
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Our data model for interacting with site settings.

  @class SiteSetting
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/

Discourse.SiteSetting = Discourse.Model.extend({

  /**
    Is the boolean setting true?

    @property enabled
  **/
  enabled: function(key, value) {

    if (arguments.length === 1) {
      // get the boolean value of the setting
      if (this.blank('value')) return false;
      return this.get('value') === 'true';

    } else {
      // set the boolean value of the setting
      this.set('value', value ? 'true' : 'false');

      // We save booleans right away, it's not like a text field where it makes sense to
      // undo what you typed in.
      this.save();
    }

  }.property('value'),

  /**
    Has the user changed the setting? If so we should save it.

    @property dirty
  **/
  dirty: function() {
    return this.get('originalValue') !== this.get('value');
  }.property('originalValue', 'value'),

  /**
    Has the setting been overridden from its default value?

    @property overridden
  **/
  overridden: function() {
    var val = this.get('value');
    var defaultVal = this.get('default');

    if (val === null) val = '';
    if (defaultVal === null) defaultVal = '';

    return val.toString() !== defaultVal.toString();
  }.property('value'),

  /**
    Reset the setting to its original value.

    @method resetValue
  **/
  resetValue: function() {
    this.set('value', this.get('originalValue'));
  },

  /**
    Save the setting's value.

    @method save
  **/
  save: function() {
    // Update the setting
    var setting = this;
    return jQuery.ajax("/admin/site_settings/" + (this.get('setting')), {
      data: { value: this.get('value') },
      type: 'PUT',
      success: function() {
        setting.set('originalValue', setting.get('value'));
      }
    });
  }
});

Discourse.SiteSetting.reopenClass({

  /**
    Retrieve all settings from the server

    @method findAll
  **/
  findAll: function() {
    var result = Em.A();
    jQuery.get("/admin/site_settings", function(settings) {
      return settings.each(function(s) {
        s.originalValue = s.value;
        return result.pushObject(Discourse.SiteSetting.create(s));
      });
    });
    return result;
  }
});




})(this);(function () {

var $ = window.jQuery;

/**
  Our data model for determining whether there's a new version of Discourse

  @class VersionCheck
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/

Discourse.VersionCheck = Discourse.Model.extend({
  upToDate: function() {
    return this.get('latest_version') === this.get('installed_version');
  }.property('latest_version', 'installed_version'),

  gitLink: function() {
    return "https://github.com/discourse/discourse/tree/" + this.get('installed_sha');
  }.property('installed_sha'),

  shortSha: function() {
    return this.get('installed_sha').substr(0,10);
  }.property('installed_sha')
});

Discourse.VersionCheck.reopenClass({
  find: function() {
    var promise = new RSVP.Promise();
    jQuery.ajax({
      url: '/admin/version_check',
      dataType: 'json',
      success: function(json) {
        promise.resolve(Discourse.VersionCheck.create(json));
      }
    });
    return promise;
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Handles routes related to customization

  @class AdminCustomizeRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/
 
Discourse.AdminCustomizeRoute = Discourse.Route.extend({
  model: function() {
    return Discourse.SiteCustomization.findAll();
  },

  renderTemplate: function() {    
    this.render({into: 'admin/templates/admin'});
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Handles the default admin route

  @class AdminDashboardRoute
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminDashboardRoute = Discourse.Route.extend({
  setupController: function(c) {
    if( !c.get('versionCheckedAt') || Date.create('12 hours ago') > c.get('versionCheckedAt') ) {
      this.checkVersion(c);
    }
  },

  renderTemplate: function() {
    this.render({into: 'admin/templates/admin'});
  },

  checkVersion: function(c) {
    if( Discourse.SiteSettings.version_checks ) {
      Discourse.VersionCheck.find().then(function(vc) {
        c.set('versionCheck', vc);
        c.set('versionCheckedAt', new Date());
        c.set('loading', false);
      });
    }
  }
});



})(this);(function () {

var $ = window.jQuery;

/**
  Handles routes related to viewing email logs.

  @class AdminEmailLogsRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminEmailLogsRoute = Discourse.Route.extend({
  model: function() {
    return Discourse.EmailLog.findAll();
  },

  renderTemplate: function() {
    this.render('admin/templates/email_logs');
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Handles routes related to viewing active flags.

  @class AdminFlagsActiveRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminFlagsActiveRoute = Discourse.Route.extend({

  model: function() {
    return Discourse.FlaggedPost.findAll('active');
  },

  setupController: function(controller, model) {
    var adminFlagsController = this.controllerFor('adminFlags');
    adminFlagsController.set('content', model);
    adminFlagsController.set('query', 'active');
  }

});




})(this);(function () {

var $ = window.jQuery;

/**
  Handles routes related to viewing old flags.

  @class AdminFlagsOldRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminFlagsOldRoute = Discourse.Route.extend({
  
  model: function() {
    return Discourse.FlaggedPost.findAll('old');
  },

  setupController: function(controller, model) {
    var adminFlagsController = this.controllerFor('adminFlags');
    adminFlagsController.set('content', model);
    adminFlagsController.set('query', 'old');
  }

});




})(this);(function () {

var $ = window.jQuery;

/**
  Basic route for admin flags

  @class AdminFlagsRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminFlagsRoute = Discourse.Route.extend({
  renderTemplate: function() {
    this.render('admin/templates/flags');
  }
});


})(this);(function () {

var $ = window.jQuery;

Discourse.AdminReportsRoute = Discourse.Route.extend({
  model: function(params) {
    return(Discourse.Report.find(params.type));
  },

  renderTemplate: function() {
    this.render('admin/templates/reports', {into: 'admin/templates/admin'});
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  The base admin route

  @class AdminRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminRoute = Discourse.Route.extend({
  renderTemplate: function() {
    this.render('admin/templates/admin');
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Builds the routes for the admin section

  @method buildRoutes
  @for Discourse.AdminRoute
**/

Discourse.Route.buildRoutes(function() {
  this.resource('admin', { path: '/admin' }, function() {
    this.route('dashboard', { path: '/' });
    this.route('site_settings', { path: '/site_settings' });
    this.route('email_logs', { path: '/email_logs' });
    this.route('customize', { path: '/customize' });

    this.resource('adminReports', { path: '/reports/:type' });

    this.resource('adminFlags', { path: '/flags' }, function() {
      this.route('active', { path: '/active' });
      this.route('old', { path: '/old' });
    });

    this.resource('adminUsers', { path: '/users' }, function() {
      this.resource('adminUser', { path: '/:username' });
      this.resource('adminUsersList', { path: '/list' }, function() {
        this.route('active', { path: '/active' });
        this.route('new', { path: '/new' });
        this.route('pending', { path: '/pending' });
      });
    });

  });
});




})(this);(function () {

var $ = window.jQuery;

/**
  Handles routes related to viewing and editing site settings.

  @class AdminSiteSettingsRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminSiteSettingsRoute = Discourse.Route.extend({
  model: function() {
    return Discourse.SiteSetting.findAll();
  },

  renderTemplate: function() {
    this.render('admin/templates/site_settings', {into: 'admin/templates/admin'});
  }    
});


})(this);(function () {

var $ = window.jQuery;

/**
  Handles routes related to users in the admin section.

  @class AdminUserRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminUserRoute = Discourse.Route.extend({
  model: function(params) {
    return Discourse.AdminUser.find(params.username);
  },

  renderTemplate: function() {
    this.render('admin/templates/user', {into: 'admin/templates/admin'});
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Handles the route that lists active users.

  @class AdminUsersListActiveRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminUsersListActiveRoute = Discourse.Route.extend({
  setupController: function() {
    return this.controllerFor('adminUsersList').show('active');
  }
});


})(this);(function () {

var $ = window.jQuery;

/**
  Handles the route that lists new users.

  @class AdminUsersListNewRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminUsersListNewRoute = Discourse.Route.extend({
  setupController: function() {
    return this.controllerFor('adminUsersList').show('new');
  }  
});


})(this);(function () {

var $ = window.jQuery;

/**
  Handles the route that lists pending users.

  @class AdminUsersListNewRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminUsersListPendingRoute = Discourse.Route.extend({
  setupController: function() {
    return this.controllerFor('adminUsersList').show('pending');
  }   
});


})(this);(function () {

var $ = window.jQuery;

/**
  Handles the route that deals with listing users

  @class AdminUsersListRoute    
  @extends Discourse.Route
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminUsersListRoute = Discourse.Route.extend({
  renderTemplate: function() {
    this.render('admin/templates/users_list', {into: 'admin/templates/admin'});
  }    
});


})(this);Ember.TEMPLATES["admin/templates/admin"] = Ember.Handlebars.compile("<div class=\"container\">\n    <div class=\"row\">\n      <div class=\"full-width\">      \n        \n        <ul class=\"nav nav-pills\">\n          <li>{{#linkTo 'admin.dashboard'}}{{i18n admin.dashboard.title}}{{/linkTo}}</li>\n          <li>{{#linkTo 'admin.site_settings'}}{{i18n admin.site_settings.title}}{{/linkTo}}</li>\n          <li>{{#linkTo 'adminUsersList.active'}}{{i18n admin.users.title}}{{/linkTo}}</li>\n          <li>{{#linkTo 'admin.email_logs'}}{{i18n admin.email_logs.title}}{{/linkTo}}</li>\n          <li>{{#linkTo 'adminFlags.active'}}{{i18n admin.flags.title}}{{/linkTo}}</li>\n          <li>{{#linkTo 'admin.customize'}}{{i18n admin.customize.title}}{{/linkTo}}</li>\n        </ul>\n  \n        <div class='boxed white admin-content'>\n          <div class='admin-contents'>\n            {{outlet}}\n          </div>\n        </div>\n  \n      </div>\n    </div>\n  </div>");
Ember.TEMPLATES["admin/templates/customize"] = Ember.Handlebars.compile("<div class='list'>\n    <div class='well'>\n    <ul class='nav nav-list'>\n      {{#each content}}\n      <li {{bindAttr class=\"this.selected:active\"}}><a {{action selectStyle this target=\"controller\"}}>{{this.description}}</a></li>\n      {{/each}}\n    </ul>\n    </div>\n  \n    <button {{action newCustomization target=\"controller\"}} class='btn btn-primary'>New</button> \n  </div>\n  \n  {{#if content.selectedItem}}\n  <div class='current-style'> \n    <div class='admin-controls'>\n      <ul class=\"nav nav-pills\">\n        <li {{bindAttr class=\"view.stylesheetActive:active\"}}>\n          <a {{action selectStylesheet href=\"true\" target=\"view\"}}>{{i18n admin.customize.css}}</a>\n        </li>\n        <li {{bindAttr class=\"view.headerActive:active\"}}>\n          <a {{action selectHeader href=\"true\" target=\"view\"}}>{{i18n admin.customize.header}}</a>\n        </li>\n      </ul>\n    </div>  \n  \n    {{#with content.selectedItem}}\n      {{view Ember.TextField class=\"style-name\" valueBinding=\"name\"}}\n      {{#if view.headerActive}}\n        {{view Discourse.AceEditorView contentBinding=\"header\" mode=\"html\"}}\n      {{/if}}\n      {{#if view.stylesheetActive}}\n        {{view Discourse.AceEditorView contentBinding=\"stylesheet\" mode=\"css\"}}\n      {{/if}}\n    {{/with}}\n    <br>\n    <div class='status-actions'>\n      <span>{{i18n admin.customize.override_default}} {{view Ember.Checkbox checkedBinding=\"content.selectedItem.override_default_style\"}}</span>\n      <span>{{i18n admin.customize.enabled}}  {{view Ember.Checkbox checkedBinding=\"content.selectedItem.enabled\"}}</span>\n      {{#unless content.selectedItem.changed}}\n      <a class='preview-link' {{bindAttr href=\"content.selectedItem.previewUrl\"}} target='_blank'>{{i18n admin.customize.preview}}</a>\n      | \n      <a href=\"/?preview-style=\" target='_blank'>{{i18n admin.customize.undo_preview}}</a><br>\n      {{/unless}}\n    </div>\n  \n    <div class='buttons'>\n      <button {{action save target=\"controller\"}} {{bindAttr disabled=\"content.selectedItem.disableSave\"}} class='btn btn-primary'>{{i18n admin.customize.save}}</button> \n      <a {{action destroy target=\"controller\"}} class='delete-link'>{{i18n admin.customize.delete}}</a> \n      <span class='saving'>{{content.savingStatus}}</span>\n    </div>\n  \n  </div>\n  {{/if}}\n  <div class='clearfix'></div>");
Ember.TEMPLATES["admin/templates/dashboard"] = Ember.Handlebars.compile("<h3>{{i18n admin.dashboard.welcome}}</h3>\n  \n  {{#if Discourse.SiteSettings.version_checks}}\n    <div {{bindAttr class=\":version-check versionCheck.critical_updates:critical:normal\"}}>\n      {{#if loading }}\n        <p>{{i18n loading}}</p>\n      {{else}}\n        <p>\n          {{i18n admin.dashboard.version}}: <span class=\"version-number\">{{ versionCheck.installed_version }}</span>\n  \n          {{#if versionCheck.installed_sha}}\n            <span class=\"git-version\">(<a {{bindAttr href=\"versionCheck.gitLink\"}} target=\"_blank\">{{versionCheck.shortSha}}</a>)</span>\n          {{/if}}\n        </p>\n  \n        <p class=\"version-notes\">\n          {{i18n admin.dashboard.latest_version}}: <span class=\"version-number\">{{ versionCheck.latest_version }}</span>\n          {{#if versionCheck.upToDate }}\n            <i class='icon icon-ok update-to-date'></i> {{i18n admin.dashboard.up_to_date}}\n          {{else}}\n            <i {{bindAttr class=\":icon :icon-warning-sign versionCheck.critical_updates:critical-updates-available:updates-available\"}}></i>\n            <span class=\"critical-note\">{{i18n admin.dashboard.critical_available}}</span>\n            <span class=\"normal-note\">{{i18n admin.dashboard.updates_available}}</span>\n            {{i18n admin.dashboard.please_upgrade}}\n          {{/if}}\n        </p>\n  \n        <p class=\"update-nag\">\n          <i class=\"icon icon-github\"></i>\n          <a href=\"https://github.com/discourse/discourse\" target=\"_blank\">{{i18n admin.dashboard.update_often}}</a>\n        </p>\n      {{/if}}\n    </div>\n  \n    <div class=\"version-check-right\">\n      <iframe src=\"http://tylerlh.github.com/github-latest-commits-widget/?username=discourse&repo=discourse&limit=10\" allowtransparency=\"true\" frameborder=\"0\" scrolling=\"no\" width=\"502px\" height=\"252px\" id=\"git-commits-widget\"></iframe>\n    </div>\n  \n    <div class='clearfix'></div>\n  {{/if}}");
Ember.TEMPLATES["admin/templates/email_logs"] = Ember.Handlebars.compile("<div class='admin-controls'>\n    <div class='span5 controls'>\n      {{view Discourse.TextField valueBinding=\"controller.testEmailAddress\" placeholderKey=\"admin.email_logs.test_email_address\"}}    \n    </div>\n    <div class='span10 controls'>\n      <button class='btn' {{action sendTestEmail target=\"controller\"}} {{bindAttr disabled=\"sendTestEmailDisabled\"}}>{{i18n admin.email_logs.send_test}}</button>\n      {{#if controller.sentTestEmail}}<span class='result-message'>{{i18n admin.email_logs.sent_test}}</span>{{/if}}\n    </div>\n  </div>\n  \n  <table class='table'> \n    <tr>\n      <th>{{i18n admin.email_logs.sent_at}}</th>\n      <th>{{i18n user.title}}</th>\n      <th>{{i18n admin.email_logs.to_address}}</th>\n      <th>{{i18n admin.email_logs.email_type}}</th>\n    </tr>\n  \n    {{#if controller.content.length}}\n      {{#group}}\n        {{#collection contentBinding=\"controller.content\" tagName=\"tbody\" itemTagName=\"tr\"}}\n            <td>{{date view.content.created_at}}</td>\n            <td>\n              {{#if view.content.user}}\n                <a href=\"/admin/users/{{unbound view.content.user.username_lower}}\">{{avatar view.content.user imageSize=\"tiny\"}}</a>\n                <a href=\"/admin/users/{{unbound view.content.user.username_lower}}\">{{view.content.user.username}}</a>\n              {{else}}\n                &mdash;\n              {{/if}}\n            </td>  \n            <td><a href='mailto:{{unbound view.content.to_address}}'>{{view.content.to_address}}</a></td>  \n            <td>{{view.content.email_type}}</td>\n        {{/collection}}\n      {{/group}}\n    {{/if}}\n  \n  </table>");
Ember.TEMPLATES["admin/templates/flags"] = Ember.Handlebars.compile("<div class='admin-controls'>\n    <div class='span15'>\n      <ul class=\"nav nav-pills\">\n        <li>{{#linkTo adminFlags.active}}{{i18n admin.flags.active}}{{/linkTo}}</li>\n        <li>{{#linkTo adminFlags.old}}{{i18n admin.flags.old}}{{/linkTo}}</li>\n      </ul>\n    </div>  \n  </div>\n  \n  \n  <table class='admin-flags'>\n    <thead>\n      <tr>\n        <th class='user'></th>\n        <th class='excerpt'></th>\n        <th class='flaggers'>{{i18n admin.flags.flagged_by}}</th>\n        <th class='last-flagged'></th>\n        <th class='action'></th>\n      </tr>\n    </thead>\n    <tbody>\n      {{#each content}}\n      <tr {{bindAttr class=\"hiddenClass\"}}>\n        <td class='user'><a href=\"/admin{{unbound user.path}}\">{{avatar user imageSize=\"small\"}}</a></td>\n        <td class='excerpt'>{{#if topicHidden}}<i title='this topic is invisible' class='icon icon-eye-close'></i> {{/if}}<h3><a href='{{unbound url}}'>{{title}}</a></h3><br>{{{excerpt}}}\n        </td>\n        <td class='flaggers'>{{#each flaggers}}<a href=\"/admin{{unbound path}}\">{{avatar this imageSize=\"small\"}}</a>{{/each}}</td>\n        <td class='last-flagged'>{{date lastFlagged}}</td>\n        <td class='action'> \n          {{#if controller.adminActiveFlagsView}}\n          <button title='{{i18n admin.flags.clear_title}}' class='btn' {{action clearFlags this}}>{{i18n admin.flags.clear}}</button>\n          <button title='{{i18n admin.flags.delete_title}}' class='btn' {{action deletePost this}}>{{i18n admin.flags.delete}}</button>\n          {{/if}}\n        </td>\n      </tr>\n  \n        {{#each messages}}\n          <tr>\n            <td></td>\n            <td class='message'>\n              <div><a href=\"/admin{{unbound user.path}}\">{{avatar user imageSize=\"small\"}}</a> {{message}}</div>\n            </td>\n            <td></td>\n            <td></td>\n            <td></td>\n          </tr>\n        {{/each}}\n      {{/each}}\n    </tbody>\n  </table>");
Ember.TEMPLATES["admin/templates/reports"] = Ember.Handlebars.compile("{{#if loaded}}\n    <h3>{{title}}</h3>\n  \n    <table class='table'>\n      <tr>\n        <th>{{xaxis}}</th>\n        <th>{{yaxis}}</th>\n      </tr>\n  \n      {{#each data}}\n        <tr>\n          <td>{{x}}</td>\n          <td>{{y}}</td>\n        </tr>\n      {{/each}}\n    </table>\n  \n  {{else}}\n    {{i18n loading}}\n  {{/if}}");
Ember.TEMPLATES["admin/templates/site_settings"] = Ember.Handlebars.compile("<div class='admin-controls'>\n    <div class='span15 search controls'>\n    <label>\n      {{view Ember.Checkbox checkedBinding=\"controller.onlyOverridden\"}}\n      {{i18n admin.site_settings.show_overriden}}\n    </label>\n    </div>\n    <div class='span5 controls'>\n      {{view Discourse.TextField valueBinding=\"controller.filter\" placeholderKey=\"type_to_filter\"}}\n    </div>\n  \n  </div>\n  \n  {{collection contentBinding=\"filteredContent\" classNames=\"form-horizontal settings\" itemViewClass=\"Discourse.SiteSettingView\"}}");
Ember.TEMPLATES["admin/templates/site_settings/setting_bool"] = Ember.Handlebars.compile("{{#with view.content}}\n    <div class='span4 offset1'>\n      <h3>{{unbound setting}}</h3>\n    </div>\n    <div class=\"span11\">\n      {{view Ember.Checkbox checkedBinding=\"enabled\" value=\"true\"}}\n      {{unbound description}}\n    </div>\n  {{/with}}");
Ember.TEMPLATES["admin/templates/site_settings/setting_string"] = Ember.Handlebars.compile("{{#with view.content}}\n    <div class='span4 offset1'>\n       <h3>{{unbound setting}}</h3>\n    </div>\n    <div class=\"span11\">\n      {{view Ember.TextField valueBinding=\"value\" classNames=\"input-xxlarge\"}}\n      <div class='desc'>{{unbound description}}</div>\n    </div>\n    {{#if dirty}}\n      <div class='span3'>\n        <button class='btn ok' {{action save this}}><i class='icon-ok'></i></button>\n        <button class='btn cancel' {{action cancel this}}><i class='icon-remove'></i></button>\n      </div>\n    {{else}}\n      {{#if overridden}}\n        <button class='btn' href='#' {{action resetDefault this}}>{{i18n admin.site_settings.reset}}</button>\n      {{/if}}\n    {{/if}}\n  {{/with}}");
Ember.TEMPLATES["admin/templates/user"] = Ember.Handlebars.compile("<section class='details'>\n    <h1>{{i18n admin.user.basics}}</h1>\n  \n    <div class='display-row'>\n      <div class='field'>{{i18n user.username.title}}</div>\n      <div class='value'>{{content.username}}</div>\n      <div class='controls'>\n        <a href=\"/users/{{unbound content.username_lower}}\" class='btn'>\n          <i class='icon icon-user'></i>\n          {{i18n admin.user.show_public_profile}}\n        </a> \n        {{#if content.can_impersonate}}\n            <button class='btn' {{action impersonate target=\"content\"}}>\n              <i class='icon icon-screenshot'></i>\n              {{i18n admin.user.impersonate}}\n            </button>\n        {{/if}}      \n      </div>\n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n user.email.title}}</div>\n      <div class='value'><a href=\"mailto:{{unbound content.email}}\">{{content.email}}</a></div>\n    </div>\n    <div class='display-row' style='height: 50px'>\n      <div class='field'>{{i18n user.avatar.title}}</div>\n      <div class='value'>{{avatar content imageSize=\"large\"}}</div>\n    </div>\n    <div class='display-row' style='height: 50px'>\n      <div class='field'>{{i18n user.ip_address.title}}</div>\n      <div class='value'>{{content.ip_address}}</div>\n      <div class='controls'>\n        <button class='btn' {{action refreshBrowsers target=\"content\"}}>\n          {{i18n admin.user.refresh_browsers}}\n        </button>\n      </div>\n    </div>\n  </section>\n  \n  \n  <section class='details'>\n    <h1>{{i18n admin.user.permissions}}</h1>\n  \n    <div class='display-row'>\n      <div class='field'>{{i18n admin.users.approved}}</div>\n      <div class='value'>\n        {{#if content.approved}}\n          {{i18n admin.user.approved_by}}        \n          <a href=\"/admin/users/{{unbound content.approved_by.username_lower}}\">{{avatar approved_by imageSize=\"small\"}}</a>\n          <a href=\"/admin/users/{{unbound username_lower}}\">{{content.approved_by.username}}</a>\n        {{else}}\n          {{i18n no_value}}\n        {{/if}}\n        \n      </div>\n      <div class='controls'>\n        {{#if content.can_approve}}        \n          <button class='btn' {{action approve target=\"content\"}}>\n            <i class='icon icon-ok'></i>\n            {{i18n admin.user.approve}}\n          </button>\n        {{/if}}    \n      </div>\n    </div>\n  \n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.admin}}</div>\n      <div class='value'>{{content.admin}}</div>\n      <div class='controls'>\n        {{#if content.can_revoke_admin}}        \n          <button class='btn' {{action revokeAdmin target=\"content\"}}>\n            <i class='icon icon-trophy'></i>\n            {{i18n admin.user.revoke_admin}}\n          </button>\n        {{/if}}\n        {{#if content.can_grant_admin}}\n          <button class='btn' {{action grantAdmin target=\"content\"}}>\n            <i class='icon icon-trophy'></i>\n            {{i18n admin.user.grant_admin}}\n          </button>\n        {{/if}}      \n      </div>\n  \n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.moderator}}</div>\n      <div class='value'>{{content.moderator}}</div>\n      <div class='controls'>\n        {{#if content.can_revoke_moderation}}        \n          <button class='btn' {{action revokeModeration target=\"content\"}}>\n            <i class='icon icon-eye-close'></i>\n            {{i18n admin.user.revoke_moderation}}\n          </button>\n        {{/if}}\n        {{#if content.can_grant_moderation}}\n          <button class='btn' {{action grantModeration target=\"content\"}}>\n            <i class='icon icon-eye-open'></i>\n            {{i18n admin.user.grant_moderation}}\n          </button>\n        {{/if}}      \n      </div>\n      \n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n trust_level}}</div>\n      <div class='value'>{{content.trustLevel.name}}</div>\n    </div>   \n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.banned}}</div>\n      <div class='value'>{{content.is_banned}}</div>\n      <div class='controls'>\n      {{#if content.is_banned}}\n        {{#if content.canBan}}\n          <button class='btn' {{action unban target=\"content\"}}>\n            <i class='icon icon-screenshot'></i>\n            {{i18n admin.user.unban}}\n          </button>\n          {{content.banDuration}}\n        {{/if}}\n      {{else}}\n        {{#if content.canBan}}\n          <button class='btn' {{action ban target=\"content\"}}>\n            <i class='icon icon-screenshot'></i>\n            {{i18n admin.user.ban}}\n          </button>\n        {{/if}}\n      {{/if}}\n      </div>\n    </div>   \n  </section>\n  \n  <section class='details'>\n    <h1>{{i18n admin.user.activity}}</h1>\n  \n    <div class='display-row'>\n      <div class='field'>{{i18n created}}</div>\n      <div class='value'>{{{content.created_at_age}}}</div>\n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n admin.users.last_emailed}}</div>\n      <div class='value'>{{{content.last_emailed_age}}}</div>\n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n last_seen}}</div>\n      <div class='value'>{{{content.last_seen_age}}}</div>\n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.like_count}}</div>\n      <div class='value'>{{content.like_count}}</div>\n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.topics_entered}}</div>\n      <div class='value'>{{content.topics_entered}}</div>\n    </div>  \n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.post_count}}</div>\n      <div class='value'>{{content.post_count}}</div>\n      <div class='controls'>\n        {{#if content.can_delete_all_posts}}\n          <button class='btn btn-danger' {{action deleteAllPosts target=\"content\"}}>\n            <i class='icon icon-trash'></i>\n            {{i18n admin.user.delete_all_posts}}\n          </button>\n        {{/if}}\n      </div>\n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.posts_read_count}}</div>\n      <div class='value'>{{content.posts_read_count}}</div>\n    </div>  \n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.flags_given_count}}</div>\n      <div class='value'>{{content.flags_given_count}}</div>\n    </div>  \n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.flags_received_count}}</div>\n      <div class='value'>{{content.flags_received_count}}</div>\n    </div>    \n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.private_topics_count}}</div>\n      <div class='value'>{{content.private_topics_count}}</div>\n    </div>\n    <div class='display-row'>\n      <div class='field'>{{i18n admin.user.time_read}}</div>\n      <div class='value'>{{{content.time_read}}}</div>\n    </div>  \n    <div class='display-row'>\n      <div class='field'>{{i18n user.invited.days_visited}}</div>\n      <div class='value'>{{{content.days_visited}}}</div>\n    </div>  \n  </section>");
Ember.TEMPLATES["admin/templates/users_list"] = Ember.Handlebars.compile("<div class='admin-controls'>\n    <div class='span15'>\n      <ul class=\"nav nav-pills\">\n        <li>{{#linkTo adminUsersList.active}}{{i18n admin.users.active}}{{/linkTo}}</li>\n        <li>{{#linkTo adminUsersList.new}}{{i18n admin.users.new}}{{/linkTo}}</li>\n        {{#if Discourse.SiteSettings.must_approve_users}}\n          <li>{{#linkTo adminUsersList.pending}}{{i18n admin.users.pending}}{{/linkTo}}</li>\n        {{/if}}\n      </ul>\n    </div>  \n    <div class='span5 username controls'>\n      {{view Discourse.TextField valueBinding=\"controller.username\" placeholderKey=\"username\"}}\n    </div>\n  </div>\n  \n  {{#if hasSelection}}\n    <div id='selected-controls'>\n      <button {{action approveUsers target=\"controller\"}} class='btn'>{{countI18n admin.users.approved_selected countBinding=\"selectedCount\"}}</button>\n    </div>\n  {{/if}}\n  \n  {{#if content.length}}\n    <table class='table'> \n      <tr>\n        {{#if showApproval}}\n          <th>{{view Ember.Checkbox checkedBinding=\"selectAll\"}}</th>\n        {{/if}}\n        <th>&nbsp;</th>\n        <th>{{i18n username}}</th>\n        <th>{{i18n email}}</th>\n        <th>{{i18n admin.users.last_emailed}}</th>\n        <th>{{i18n last_seen}}</th>\n        <th>{{i18n admin.user.topics_entered}}</th>\n        <th>{{i18n admin.user.posts_read_count}}</th>\n        <th>{{i18n admin.user.time_read}}</th>\n        <th>{{i18n created}}</th>  \n        {{#if showApproval}}\n          <th>{{i18n admin.users.approved}}</th>\n        {{/if}}\n        <th>&nbsp;</th>\n  \n      </tr>\n  \n      {{#each content}}\n        <tr {{bindAttr class=\"selected\"}}>\n          {{#if controller.showApproval}}\n            <td>\n              {{#if can_approve}}\n                {{view Ember.Checkbox checkedBinding=\"selected\"}}\n              {{/if}}\n            </td>\n          {{/if}}\n          <td>\n            <a href=\"/admin/users/{{unbound username_lower}}\">{{avatar this imageSize=\"small\"}}</a>\n          </td>\n          <td><a href=\"/admin/users/{{unbound username_lower}}\">{{unbound username}}</a></td>\n          <td>{{unbound email}}</td>\n          <td>{{{unbound last_emailed_age}}}</td>\n          <td>{{{unbound last_seen_age}}}</td>\n          <td>{{{unbound topics_entered}}}</td>\n          <td>{{{unbound posts_read_count}}}</td>\n          <td>{{{unbound time_read}}}</td>\n          \n          <td>{{{unbound created_at_age}}}</td>\n          \n          {{#if controller.showApproval}}\n          <td>\n            {{#if approved}}\n              {{i18n yes_value}}\n            {{else}}\n              {{i18n no_value}}\n            {{/if}}\n          </td>\n          {{/if}}\n          <td>{{#if admin}}<i class=\"icon-trophy\"></i>{{/if}}<td>\n        </tr>\n      {{/each}}\n  \n    </table>\n  {{else}}\n    <div class='admin-loading'>{{i18n loading}}</div>\n  {{/if}}");
(function () {

var $ = window.jQuery;

/*global ace:true */

/**
  A view that wraps the ACE editor (http://ace.ajax.org/)

  @class AceEditorView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/

Discourse.AceEditorView = Discourse.View.extend({
  mode: 'css',
  classNames: ['ace-wrapper'],

  contentChanged: (function() {
    if (this.editor && !this.skipContentChangeEvent) {
      return this.editor.getSession().setValue(this.get('content'));
    }
  }).observes('content'),

  render: function(buffer) {
    buffer.push("<div class='ace'>");
    if (this.get('content')) {
      buffer.push(Handlebars.Utils.escapeExpression(this.get('content')));
    }
    return buffer.push("</div>");
  },

  willDestroyElement: function() {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  },

  didInsertElement: function() {
    var initAce,
      _this = this;
    initAce = function() {
      _this.editor = ace.edit(_this.$('.ace')[0]);
      _this.editor.setTheme("ace/theme/chrome");
      _this.editor.setShowPrintMargin(false);
      _this.editor.getSession().setMode("ace/mode/" + (_this.get('mode')));
      return _this.editor.on("change", function(e) {
        /* amending stuff as you type seems a bit out of scope for now - can revisit after launch
           changes = @get('changes')
           unless changes
             changes = []
             @set('changes', changes)
           changes.push e.data
        */
        _this.skipContentChangeEvent = true;
        _this.set('content', _this.editor.getSession().getValue());
        _this.skipContentChangeEvent = false;
      });
    };
    if (window.ace) {
      return initAce();
    } else {
      return $LAB.script('http://d1n0x3qji82z53.cloudfront.net/src-min-noconflict/ace.js').wait(initAce);
    }
  }
});




})(this);(function () {

var $ = window.jQuery;

/*global Mousetrap:true */

/**
  A view to handle site customizations

  @class AdminCustomizeView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminCustomizeView = Discourse.View.extend({
  templateName: 'admin/templates/customize',
  classNames: ['customize'],

  init: function() {
    this._super();
    this.set('selected', 'stylesheet');
  },

  headerActive: (function() {
    return this.get('selected') === 'header';
  }).property('selected'),

  stylesheetActive: (function() {
    return this.get('selected') === 'stylesheet';
  }).property('selected'),

  selectHeader: function() {
    this.set('selected', 'header');
  },

  selectStylesheet: function() {
    this.set('selected', 'stylesheet');
  },

  didInsertElement: function() {
    var _this = this;
    return Mousetrap.bindGlobal(['meta+s', 'ctrl+s'], function() {
      _this.get('controller').save();
      return false;
    });
  },

  willDestroyElement: function() {
    return Mousetrap.unbindGlobal('meta+s', 'ctrl+s');
  }

});


})(this);(function () {

var $ = window.jQuery;

/**
  The default view in the admin section

  @class AdminDashboardView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/

Discourse.AdminDashboardView = Discourse.View.extend({
  templateName: 'admin/templates/dashboard'
});




})(this);(function () {

var $ = window.jQuery;

/**
  A view to display a site setting with edit controls

  @class SiteSettingView
  @extends Discourse.View
  @namespace Discourse
  @module Discourse
**/

Discourse.SiteSettingView = Discourse.View.extend({
  classNameBindings: [':row', ':setting', 'content.overridden'],

  templateName: function() {

    // If we're editing a boolean, return a different template
    if (this.get('content.type') === 'bool') return 'admin/templates/site_settings/setting_bool'

    // Default to string editor
    return 'admin/templates/site_settings/setting_string';

  }.property('content.type')

});


})(this);(function () {

var $ = window.jQuery;



})(this);