/**
  This view is used for rendering the buttons at the footer of the topic

  @class TopicFooterButtonsView
  @extends Discourse.ContainerView
  @namespace Discourse
  @module Discourse
**/
Discourse.TopicFooterButtonsView = Discourse.ContainerView.extend({
  elementId: 'topic-footer-buttons',
  topicBinding: 'controller.content',
	
  init: function() {
    this._super();
    this.createButtons();
  },

  // Add the buttons below a topic
  createButtons: function() {
		var topic = this.get('topic');
		
    if (Discourse.User.current()) {
			if (topic.get('archetype') == 'event'){
          this.addObject(Discourse.ButtonView.createWithMixins({
            helpKey: 'topic.rsvp.' + this.get('controller.content.user_rsvp_status') + '.help',
						classNames: ['btn', 'btn-primary'],
						
          	rsvpChanged: (function() {
							topic.set('gcal', null)
            	this.rerender();
							if (this.get('controller.content.user_rsvp_status') == 'registered'){
								var starts = topic.get('starts_at');
								var ends = topic.get('ends_at');
								var location = topic.get('location');
								var title = topic.get('title');
								
								var url = "http://www.google.com/calendar/event?action=TEMPLATE&text=" + escape(title) + '&dates=' + starts + '/' + ends + '&location=' + location + '&trp=true&sprop=net.vaynermedia.com&sprop=name:Vaynernet';
								var prints = "You're registered! <a href='" + url + "' target='_blank'>Add to your Google Calendar</a>"
								topic.set('gcal', new Handlebars.SafeString(prints));
								}
          	}).observes('controller.content.user_rsvp_status'),
						
						textKey: (function() {
	          	return 'topic.rsvp.' + this.get('controller.content.user_rsvp_status') + '.text';
	        	}).property('controller.content.user_rsvp_status'),

            renderIcon: function(buffer) {
							// return = (function() {
							switch (this.get('controller.content.user_rsvp_status')) {
                case 'open':
                  buffer.push("<i class='icon icon-check'></i>");
									break;
                case 'waitlist':
                  buffer.push("<i class='icon icon-group'></i>");
									break;
								case 'registered':
                  buffer.push("<i class='icon icon-remove'></i>");
                	break;
								case 'waitlisted':
                  buffer.push("<i class='icon icon-remove'></i>");
              		break;
								}
							return false
						},

            click: function() {
							console.log(this.get('controller'));
            	this.get('controller').toggleRsvp();
						}
          }));

        // We hide some controls from private messages
        if (this.get('topic.details.can_invite_to')) {
        }
        this.attachViewClass(Discourse.FavoriteButton);

      }
      this.attachViewClass(Discourse.ReplyButton);

      if (!topic.get('isPrivateMessage')) {
        this.attachViewClass(Discourse.NotificationsButton);
      }
      this.trigger('additionalButtons', this);
    } else {
      // If not logged in give them a login control
      this.attachViewClass(Discourse.LoginReplyButton);
    }
  }
});


