# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "facter"
  s.version = "1.6.17"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Puppet Labs"]
  s.date = "2012-12-27"
  s.description = "You can prove anything with facts!"
  s.email = "info@puppetlabs.com"
  s.executables = ["facter"]
  s.files = ["bin/facter"]
  s.homepage = "https://github.com/puppetlabs/facter"
  s.require_paths = ["lib"]
  s.rubygems_version = "2.0.2"
  s.summary = "Facter, a system inventory tool"
end
