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
		switch(alert_type)
			{
			case 1:
			  html = "<i class='icon icon-exclamation-sign'></i><span style='margin-left:15px'>Important Notice!</span>";
				break;
			case 2:
				html = "<i class='icon icon-calendar'></i><span style='margin-left:15px'>Heads up! - Flash Lessons Today:</span>";
				break;
			case 3:
				html = "<i class='icon icon-gift'></i><span style='margin-left:15px'>Celebrate!</span>";
				break;
			}
		return new Handlebars.SafeString(html);
	}).property(),

  backgroundClass: (function() {
		console.log('applying bg class');
			var _class;
			var alert_type = this.alert_type;
		console.log(alert_type);	
			switch(alert_type)
			{
			case 1:
				_class = 'announcement';
				break;				
			case 2:
				_class = 'flash-lesson';
				break;
			case 3:
				_class =  'vaynerversary';
				break;
			}
			return _class;
		}).property(),

  url: (function() {
    var slug;
    if (this.blank('data.topic_title')) return "";
    slug = this.get('slug');
    return Discourse.getURL("/t/") + slug + "/" + (this.get('topic_id')) + "/" + (this.get('post_number'));
  }).property(),

  rendered: (function() {
      var html = " &#183; <a href='" + (this.get('url')) + "'>Please Click Here</a>"
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