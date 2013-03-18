# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "certified"
  s.version = "0.1.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Stevie Graham"]
  s.date = "2012-08-28"
  s.description = "Ensure net/https uses OpenSSL::SSL::VERIFY_PEER to verify SSL certificates and provides certificate bundle in case OpenSSL cannot find one"
  s.email = "sjtgraham@mac.com"
  s.homepage = "http://github.com/stevegraham/certified"
  s.require_paths = ["."]
  s.required_ruby_version = Gem::Requirement.new(">= 1.8.7")
  s.rubygems_version = "2.0.2"
  s.summary = "Ensure net/https uses OpenSSL::SSL::VERIFY_PEER to verify SSL certificates and provides certificate bundle in case OpenSSL cannot find one"
end
