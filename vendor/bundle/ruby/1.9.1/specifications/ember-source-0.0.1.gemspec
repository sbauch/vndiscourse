# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "ember-source"
  s.version = "0.0.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Yehuda Katz"]
  s.date = "2013-02-26"
  s.description = "Ember.js source code wrapper for use with Ruby libs."
  s.email = ["wycats@gmail.com"]
  s.homepage = "https://github.com/emberjs/ember.js"
  s.require_paths = ["lib"]
  s.rubygems_version = "2.0.2"
  s.summary = "Ember.js source code wrapper."

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<handlebars-source>, ["< 1.0.0.rc4", ">= 1.0.0.rc3"])
    else
      s.add_dependency(%q<handlebars-source>, ["< 1.0.0.rc4", ">= 1.0.0.rc3"])
    end
  else
    s.add_dependency(%q<handlebars-source>, ["< 1.0.0.rc4", ">= 1.0.0.rc3"])
  end
end
