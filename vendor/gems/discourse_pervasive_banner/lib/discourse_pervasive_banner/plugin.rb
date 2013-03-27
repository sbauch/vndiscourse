require 'discourse_plugin'

module DiscoursePervasiveBanner

  class Plugin < DiscoursePlugin
    
    def setup
      # Add our Assets
      register_js('discourse_pervasive_banner')
      #register_js('alert.js.handlebars')
      register_js('alert_controller')
      register_js('alert_view')
      register_js('alert')      
      register_css('discourse_pervasive_banner')
    end

  end
end
