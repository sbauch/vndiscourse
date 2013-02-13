# lib/discourse_pervasive_banner/plugin.rb
require File.expand_path('../../../../discourse_plugin/lib/discourse_plugin/discourse_plugin.rb', __FILE__)

module DiscourseUserDirectory

  class Plugin < DiscoursePlugin

    def setup
      add_route('get', 'directory', 'directories', 'index')
      
      # Add our Assets
      # register_js('discourse_user_directory')
      # register_css('discourse_user_directory')
    end

  end
end