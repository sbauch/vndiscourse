/**
  The common route stuff for a user's preference

  @class PreferencesRoute
  @extends Discourse.RestrictedUserRoute
  @namespace Discourse
  @module Discourse
**/
Discourse.PreferencesRoute = Discourse.RestrictedUserRoute.extend({
  model: function() {
    return this.modelFor('user');
  },

  renderTemplate: function() {
    this.render('preferences', { into: 'user', outlet: 'userOutlet', controller: 'preferences' });
  }
});

/**
  This controller supports actions related to updating one's preferences

  @class PreferencesController
  @extends Discourse.ObjectController
  @namespace Discourse
  @module Discourse
**/
Discourse.PreferencesController = Discourse.ObjectController.extend({
  // By default we haven't saved anything
  saved: false,
	teamsLoaded: false,
  saveDisabled: function() {
    if (this.get('saving')) return true;
    if (this.blank('name')) return true;
    if (this.blank('email')) return true;
    return false;
  }.property('saving', 'name', 'email'),

  digestFrequencies: [{ name: I18n.t('user.email_digests.daily'), value: 1 },
                      { name: I18n.t('user.email_digests.weekly'), value: 7 },
                      { name: I18n.t('user.email_digests.bi_weekly'), value: 14 }],

  autoTrackDurations: [{ name: I18n.t('user.auto_track_options.never'), value: -1 },
                       { name: I18n.t('user.auto_track_options.always'), value: 0 },
                       { name: I18n.t('user.auto_track_options.after_n_seconds', { count: 30 }), value: 30000 },
                       { name: I18n.t('user.auto_track_options.after_n_minutes', { count: 1 }), value: 60000 },
                       { name: I18n.t('user.auto_track_options.after_n_minutes', { count: 2 }), value: 120000 },
                       { name: I18n.t('user.auto_track_options.after_n_minutes', { count: 3 }), value: 180000 },
                       { name: I18n.t('user.auto_track_options.after_n_minutes', { count: 4 }), value: 240000 },
                       { name: I18n.t('user.auto_track_options.after_n_minutes', { count: 5 }), value: 300000 },
                       { name: I18n.t('user.auto_track_options.after_n_minutes', { count: 10 }), value: 600000 }],

  considerNewTopicOptions: [{ name: I18n.t('user.new_topic_duration.not_viewed'), value: -1 },
                            { name: I18n.t('user.new_topic_duration.after_n_days', { count: 1 }), value: 60 * 24 },
                            { name: I18n.t('user.new_topic_duration.after_n_days', { count: 2 }), value: 60 * 48 },
                            { name: I18n.t('user.new_topic_duration.after_n_weeks', { count: 1 }), value: 7 * 60 * 24 },
                            { name: I18n.t('user.new_topic_duration.last_here'), value: -2 }],

	teamSelected: (function() {
		var opts;
    opts = Em.A();
		var teamsHash = this.get('content.team_hash')
		_.each(teamsHash, function(team){
			console.log(team);
			var obj = opts.addObject({ name: team.name, value: team.id });

		})
		return opts;
		}).property(),
	
		

  teamOptions: (function() {
		var teams = Em.A();
		teams.addObject({ name: '6PM', value: 1});
		teams.addObject({ name: 'Tully\'s Coffee', value: 2});
		teams.addObject({ name: 'Avión', value: 3});
		teams.addObject({ name: 'GE', value: 4});
		teams.addObject({ name: 'Brew Over Ice', value: 5});
		teams.addObject({ name: 'Lipton Iced Tea', value: 6});
		teams.addObject({ name: 'Pure Leaf', value: 7});
		teams.addObject({ name: 'Brisk', value: 8});
		teams.addObject({ name: 'Meow Mix', value: 9});
		teams.addObject({ name: 'Cafe Escapes', value: 10});
		teams.addObject({ name: 'Zappos Couture', value: 11});
		teams.addObject({ name: 'Tropicana', value: 12});
		teams.addObject({ name: 'OWN', value: 13});
		teams.addObject({ name: 'NFL', value: 14});
		teams.addObject({ name: 'Brooklyn Nets', value: 15});
		teams.addObject({ name: 'New York Jets', value: 16});
		teams.addObject({ name: 'PepsiCo', value: 17});
		teams.addObject({ name: 'WilcoHess', value: 18});
		teams.addObject({ name: 'Microsoft SMB', value: 19});
		teams.addObject({ name: 'Nature\'s Recipe', value: 20});
		teams.addObject({ name: 'Snausages', value: 21});
		teams.addObject({ name: 'Del Monte', value: 22});
		teams.addObject({ name: 'Bloomberg Arts Program', value: 23});
		teams.addObject({ name: 'Hess Express', value: 24});
		teams.addObject({ name: 'Kibbles n\' Bits', value: 25});
		teams.addObject({ name: 'Gary', value: 26});
		teams.addObject({ name: 'VaynerApps', value: 27});
		teams.addObject({ name: 'VaynerMedia', value: 28});
		teams.addObject({ name: 'Analytics', value: 29});
		teams.addObject({ name: 'Fun!', value: 30});
		teams.addObject({ name: 'Creative', value: 31});
		teams.addObject({ name: 'Legal', value: 32});
		teams.addObject({ name: 'Emerging Technology', value: 33});
		teams.addObject({ name: 'PR', value: 34});
		teams.addObject({ name: 'VMBA', value: 35});
		teams.addObject({ name: 'Sports!', value: 36});
		teams.addObject({ name: 'Pup-Peroni', value: 37});
		teams.addObject({ name: '9Lives', value: 38});
		teams.addObject({ name: 'Strategy', value: 39});
		teams.addObject({ name: 'Ads', value: 40});
		teams.addObject({ name: 'Green Mountain Coffee Roasters', value: 41});
		teams.addObject({ name: 'Barclays Center', value: 42});
		teams.addObject({ name: 'USA Today', value: 43});
		teams.addObject({ name: 'Milo\'s Kitchen', value: 44});
		teams.addObject({ name: 'Nilla Wafers', value: 45});
		teams.addObject({ name: 'Quaker', value: 46});
		teams.addObject({ name: 'Unassigned', value: 47});
		teams.addObject({ name: 'Furby', value: 48});
		teams.addObject({ name: 'Playskool', value: 49});
		teams.addObject({ name: 'Playdoh', value: 50});
		teams.addObject({ name: 'Ritz', value: 51});
		teams.addObject({ name: 'Fire Safety', value: 52});
		teams.addObject({ name: 'FOX', value: 53});
		teams.addObject({ name: 'Twister', value: 54});
		teams.addObject({ name: 'Monopoly ', value: 55});
		teams.addObject({ name: 'Milk-Bone', value: 56});
		teams.addObject({ name: 'Delivering Happiness', value: 57});
		teams.addObject({ name: 'Aquafina', value: 58});
		teams.addObject({ name: 'Trident', value: 59});
		teams.addObject({ name: 'Hasbro Game Night', value: 60});
		teams.addObject({ name: 'Nerf', value: 61});
		teams.addObject({ name: 'Trop50', value: 62});
		teams.addObject({ name: 'Dove', value: 63});
		teams.addObject({ name: 'American Idol', value: 64});
		teams.addObject({ name: 'Yahtzee', value: 65});
		teams.addObject({ name: 'Finance', value: 66});
		teams.addObject({ name: 'HR', value: 67});
		teams.addObject({ name: 'GE Appliances', value: 68});
		teams.addObject({ name: 'GMC', value: 69});
		teams.addObject({ name: 'Slim-Fast', value: 70});
		teams.addObject({ name: 'Contadina', value: 71});
		teams.addObject({ name: 'College Inn', value: 72});
		teams.addObject({ name: '#vegastech', value: 73});
		teams.addObject({ name: 'Timex', value: 74});
		return teams;
		// var opts;
		//    	opts = Em.A();
		// var self = this;
		// 		Discourse.ajax("http://vaynerpeople.herokuapp.com/api/teams?token=cqOR1F80vsKOGndLWS7ekg", {
		//       type: 'GET',
		//     }).then(function (teams) {
		// 		 	_.each(teams.teams, function(team) {
		// 				opts.addObject({ name: team.name, value: team.id });
		// 			});
		// 				console.log(self.get('teamsLoaded'));
		// 			console.log('fucokgin anything');
		// 			self.set('teamsLoaded', true);
		// 			console.log(self.get('teamsLoaded'));
		// 		});	
		// return opts;
  }).property(),

	currentTeams: (function(){
		console.log(Discourse.User.current().teams);
		// teams = Discourse.User.current().teams.split(",");
		// 				arr = Em.A();
		// 				_.each(teams, function(team){
		// 					arr.addObject({name:team, id: 0 })
		// 				})
		// 				return arr
		
	}).property(),

  save: function() {
    var preferencesController = this;
    this.set('saving', true);
    this.set('saved', false);
		
    // Cook the bio for preview

    var model = this.get('model');
    return model.save().then(function() {
      // model was saved
      preferencesController.set('saving', false);
      if (Discourse.User.current('id') === model.get('id')) {
        Discourse.User.current().set('name', model.get('name'));
      }

      preferencesController.set('bio_cooked',
                                Discourse.Markdown.cook(preferencesController.get('bio_raw')));
      preferencesController.set('saved', true);
    }, function() {
      // model failed to save
      preferencesController.set('saving', false);
      alert(I18n.t('generic_error'));
    });
  },

  saveButtonText: function() {
    return this.get('saving') ? I18n.t('saving') : I18n.t('save');
  }.property('saving'),

  changePassword: function() {
    var preferencesController = this;
    if (!this.get('passwordProgress')) {
      this.set('passwordProgress', I18n.t("user.change_password.in_progress"));
      return this.get('model').changePassword().then(function() {
        // password changed
        preferencesController.setProperties({
          changePasswordProgress: false,
          passwordProgress: I18n.t("user.change_password.success")
        });
      }, function() {
        // password failed to change
        preferencesController.setProperties({
          changePasswordProgress: false,
          passwordProgress: I18n.t("user.change_password.error")
        });
      });
    }
  }
});



