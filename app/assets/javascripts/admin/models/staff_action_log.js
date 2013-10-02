/**
  Represents an action taken by a staff member that has been logged.

  @class StaffActionLog
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
Discourse.StaffActionLog = Discourse.Model.extend({
  showFullDetails: false,

  actionName: function() {
    return I18n.t("admin.logs.staff_actions.actions." + this.get('action_name'));
  }.property('action_name'),

  formattedDetails: function() {
    var formatted = "";
    formatted += this.format('email', 'email');
    formatted += this.format('admin.logs.staff_actions.ip_address', 'ip_address');
    if (!this.get('useCustomModalForDetails')) {
      formatted += this.format('admin.logs.staff_actions.new_value', 'new_value');
      formatted += this.format('admin.logs.staff_actions.previous_value', 'previous_value');
    }
    return formatted;
  }.property('ip_address', 'email'),

  format: function(label, propertyName) {
    if (this.get(propertyName)) {
      return ('<b>' + I18n.t(label) + ':</b> ' + this.get(propertyName) + '<br/>');
    } else {
      return '';
    }
  },

  useModalForDetails: function() {
    return (this.get('details') && this.get('details').length > 0);
  }.property('action_name'),

  useCustomModalForDetails: function() {
    return _.contains(['change_site_customization', 'delete_site_customization'], this.get('action_name'));
  }.property('action_name')
});

Discourse.StaffActionLog.reopenClass({
  create: function(attrs) {
    if (attrs.staff_user) {
      attrs.staff_user = Discourse.AdminUser.create(attrs.staff_user);
    }
    if (attrs.target_user) {
      attrs.target_user = Discourse.AdminUser.create(attrs.target_user);
    }
    return this._super(attrs);
  },

  findAll: function(filters) {
    return Discourse.ajax("/admin/logs/staff_action_logs.json", { data: filters }).then(function(staff_actions) {
      return staff_actions.map(function(s) {
        return Discourse.StaffActionLog.create(s);
      });
    });
  }
});
