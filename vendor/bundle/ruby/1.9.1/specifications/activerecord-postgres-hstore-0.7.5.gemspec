# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "activerecord-postgres-hstore"
  s.version = "0.7.5"

  s.required_rubygems_version = Gem::Requirement.new(">= 1.3.6") if s.respond_to? :required_rubygems_version=
  s.authors = ["Juan Maiz", "Diogo Biazus"]
  s.date = "2013-02-14"
  s.description = "This gem adds support for the postgres hstore type. It is the _just right_ alternative for storing hashes instead of using seralization or dynamic tables."
  s.email = "juanmaiz@gmail.com"
  s.homepage = "http://github.com/engageis/activerecord-postgres-hstore"
  s.licenses = ["MIT"]
  s.require_paths = ["lib"]
  s.required_ruby_version = Gem::Requirement.new(">= 1.8.7")
  s.rubygems_version = "2.0.2"
  s.summary = "Goodbye serialize, hello hstore"

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<activerecord>, [">= 3.1"])
      s.add_runtime_dependency(%q<rake>, [">= 0"])
      s.add_runtime_dependency(%q<pg-hstore>, [">= 1.1.5"])
      s.add_development_dependency(%q<bundler>, [">= 0"])
      s.add_development_dependency(%q<rdoc>, [">= 0"])
      s.add_development_dependency(%q<rspec>, ["~> 2.11"])
    else
      s.add_dependency(%q<activerecord>, [">= 3.1"])
      s.add_dependency(%q<rake>, [">= 0"])
      s.add_dependency(%q<pg-hstore>, [">= 1.1.5"])
      s.add_dependency(%q<bundler>, [">= 0"])
      s.add_dependency(%q<rdoc>, [">= 0"])
      s.add_dependency(%q<rspec>, ["~> 2.11"])
    end
  else
    s.add_dependency(%q<activerecord>, [">= 3.1"])
    s.add_dependency(%q<rake>, [">= 0"])
    s.add_dependency(%q<pg-hstore>, [">= 1.1.5"])
    s.add_dependency(%q<bundler>, [">= 0"])
    s.add_dependency(%q<rdoc>, [">= 0"])
    s.add_dependency(%q<rspec>, ["~> 2.11"])
  end
end
