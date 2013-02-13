# lib/discourse_pervasive_banner/plugin.rb
require File.expand_path('../../../../discourse_plugin/lib/discourse_plugin/discourse_plugin.rb', __FILE__)

module DiscourseUserDirectory

  class Plugin < DiscoursePlugin

    def setup
      Rails.application.routes.draw do |map|
        get '/directory' => 'directories#index'
      end
      # Add our Assets
      # register_js('discourse_user_directory')
      # register_css('discourse_user_directory')
    end

  end
end