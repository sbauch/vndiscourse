require "active_attr/error"

module ActiveAttr
  module Typecasting
    # This exception is raised if attempting to cast to an unknown type when
    # using {Typecasting}
    #
    # @since 0.6.0
    class UnknownTypecasterError < TypeError
      include Error
    end
  end
end
