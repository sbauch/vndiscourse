// Pagedown customizations
//= require ./pagedown_custom.js

// The rest of the externals
//= require_tree ./external

//= require ./discourse/helpers/i18n_helpers
//= require ./discourse

//= require ./locales/date_locales.js

// Stuff we need to load first
//= require_tree ./discourse/mixins
//= require ./discourse/views/view
//= require ./discourse/components/debounce
//= require ./discourse/controllers/controller
//= require ./discourse/controllers/object_controller
//= require ./discourse/views/modal/modal_body_view
//= require ./discourse/views/combobox_view
//= require ./discourse/views/buttons/button_view
//= require ./discourse/views/buttons/dropdown_button_view
//= require ./discourse/models/model
//= require ./discourse/routes/discourse_route
//= require ./discourse/routes/discourse_restricted_user_route

//= require_tree ./discourse/controllers
//= require_tree ./discourse/components
//= require_tree ./discourse/models
//= require_tree ./discourse/views
//= require_tree ./discourse/helpers
//= require_tree ./discourse/templates
//= require_tree ./discourse/routes

//= require ./external/browser-update.js
