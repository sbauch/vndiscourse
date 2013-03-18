# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "clockwork"
  s.version = "0.4.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Adam Wiggins"]
  s.date = "2012-07-17"
  s.description = "A scheduler process to replace cron, using a more flexible Ruby syntax running as a single long-running process.  Inspired by rufus-scheduler and resque-scheduler."
  s.email = "adam@heroku.com"
  s.executables = ["clockwork"]
  s.extra_rdoc_files = ["README.md"]
  s.files = ["bin/clockwork", "README.md"]
  s.homepage = "http://github.com/tomykaira/clockwork"
  s.require_paths = ["lib"]
  s.rubyforge_project = "clockwork"
  s.rubygems_version = "2.0.2"
  s.summary = "A scheduler process to replace cron."

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<tzinfo>, [">= 0"])
      s.add_development_dependency(%q<jeweler>, [">= 0"])
      s.add_development_dependency(%q<contest>, [">= 0"])
      s.add_development_dependency(%q<mocha>, [">= 0"])
    else
      s.add_dependency(%q<tzinfo>, [">= 0"])
      s.add_dependency(%q<jeweler>, [">= 0"])
      s.add_dependency(%q<contest>, [">= 0"])
      s.add_dependency(%q<mocha>, [">= 0"])
    end
  else
    s.add_dependency(%q<tzinfo>, [">= 0"])
    s.add_dependency(%q<jeweler>, [">= 0"])
    s.add_dependency(%q<contest>, [">= 0"])
    s.add_dependency(%q<mocha>, [">= 0"])
  end
end
