# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "pg-hstore"
  s.version = "1.1.7"

  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Peter van Hardenberg", "Seamus Abshere", "Greg Price"]
  s.date = "2013-02-20"
  s.description = "postgresql hstore parser/deparser - provides PgHstore.dump and PgHstore.load (aka parse)"
  s.email = ["pvh@heroku.com", "seamus@abshere.net"]
  s.homepage = "https://github.com/seamusabshere/pg-hstore"
  s.require_paths = ["lib"]
  s.rubygems_version = "2.0.2"
  s.summary = "postgresql hstore parser/deparser - provides PgHstore.dump and PgHstore.load (aka parse)"

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_development_dependency(%q<rspec>, [">= 0"])
      s.add_development_dependency(%q<pg>, [">= 0"])
    else
      s.add_dependency(%q<rspec>, [">= 0"])
      s.add_dependency(%q<pg>, [">= 0"])
    end
  else
    s.add_dependency(%q<rspec>, [">= 0"])
    s.add_dependency(%q<pg>, [">= 0"])
  end
end
