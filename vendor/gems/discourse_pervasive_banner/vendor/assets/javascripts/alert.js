/**
  A data model representing a sitewide alert

  @class Alert
  @extends Discourse.Model
  @namespace Discourse
  @module Discourse
**/
Discourse.Alert = Discourse.Model.extend({
	icon: (function() {
		var html;
		var alert_type = this.get('alert_type');
		console.log(alert_type);
		if (alert_type == 2){
		html = "<i class='icon icon-calendar'></i><span style='margin-left:15px'>Heads up! - Flash Lessons Today:</span>"
		} else
		{
		html = "<i class='icon icon-exclamation-sign'></i><span style='margin-left:15px'>Important Notice!</span>"
		}
		return new Handlebars.SafeString(html);
	}).property(),

  readClass: (function() {
    if (this.read) return 'read';
    return '';
  }).property('read'),

  url: (function() {
    var slug;
    if (this.blank('data.topic_title')) return "";
    slug = this.get('slug');
    return Discourse.getURL("/t/") + slug + "/" + (this.get('topic_id')) + "/" + (this.get('post_number'));
  }).property(),

  rendered: (function() {
      var html = " &#183; <a href='" + (this.get('url')) + "'>Click Here for More</a>"
			return new Handlebars.SafeString(html);
  }).property()

});

Discourse.Alert.reopenClass({
  create: function(obj) {
    var result;
    result = this._super(obj);
    if (obj.data) {
      result.set('data', Em.Object.create(obj.data));
    }
    return result;
  }
});