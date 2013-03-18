# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  s.name = "acts_as_paranoid"
  s.version = "0.4.1"

  s.required_rubygems_version = Gem::Requirement.new(">= 1.3.6") if s.respond_to? :required_rubygems_version=
  s.authors = ["Goncalo Silva", "Charles G.", "Rick Olson"]
  s.date = "2012-12-12"
  s.description = "Active Record (~>3.2) plugin which allows you to hide and restore records without actually deleting them. Check its GitHub page for more in-depth information."
  s.email = ["goncalossilva@gmail.com"]
  s.homepage = "https://github.com/goncalossilva/rails3_acts_as_paranoid"
  s.require_paths = ["lib"]
  s.rubyforge_project = "acts_as_paranoid"
  s.rubygems_version = "2.0.2"
  s.summary = "Active Record (~>3.2) plugin which allows you to hide and restore records without actually deleting them."

  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<activerecord>, ["~> 3.2"])
    else
      s.add_dependency(%q<activerecord>, ["~> 3.2"])
    end
  else
    s.add_dependency(%q<activerecord>, ["~> 3.2"])
  end
end
