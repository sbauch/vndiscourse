# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "mixlib-log"
  s.version = "1.4.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Opscode, Inc."]
  s.date = "2012-06-08"
  s.email = "info@opscode.com"
  s.extra_rdoc_files = ["README.rdoc", "LICENSE", "NOTICE"]
  s.files = ["README.rdoc", "LICENSE", "NOTICE"]
  s.homepage = "http://www.opscode.com"
  s.require_paths = ["lib"]
  s.rubygems_version = "2.0.2"
  s.summary = "A gem that provides a simple mixin for log functionality"

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_development_dependency(%q<rake>, ["~> 0.9.2.2"])
      s.add_development_dependency(%q<rspec>, ["~> 2.10.0"])
      s.add_development_dependency(%q<cucumber>, ["~> 1.2.0"])
    else
      s.add_dependency(%q<rake>, ["~> 0.9.2.2"])
      s.add_dependency(%q<rspec>, ["~> 2.10.0"])
      s.add_dependency(%q<cucumber>, ["~> 1.2.0"])
    end
  else
    s.add_dependency(%q<rake>, ["~> 0.9.2.2"])
    s.add_dependency(%q<rspec>, ["~> 2.10.0"])
    s.add_dependency(%q<cucumber>, ["~> 1.2.0"])
  end
end
