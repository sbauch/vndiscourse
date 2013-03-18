require "active_support/core_ext/string/conversions"
require "active_support/time"

module ActiveAttr
  module Typecasting
    # Typecasts an Object to a Date
    #
    # @example Usage
    #   DateTypecaster.new.call("2012-01-01") #=> Sun, 01 Jan 2012
    #
    # @since 0.5.0
    class DateTypecaster
      # Typecasts an object to a Date
      #
      # Attempts to convert using #to_date.
      #
      # @example Typecast a String
      #   typecaster.call("2012-01-01") #=> Sun, 01 Jan 2012
      #
      # @param [Object, #to_date] value The object to typecast
      #
      # @return [Date, nil] The result of typecasting
      #
      # @since 0.5.0
      def call(value)
        value.to_date if value.respond_to? :to_date
      rescue NoMethodError
      end
    end
  end
end
