module Discourse
  # work around reloader 
  unless defined? ::Discourse::VERSION 
    module VERSION #:nodoc:
      MAJOR = 0
      MINOR = 8
      TINY  = 4
      PRE   = nil

      STRING = [MAJOR, MINOR, TINY, PRE].compact.join('.')
    end
  end
end
