module Export

  class SchemaArgumentsError < RuntimeError; end

  class JsonEncoder

    def initialize
      @table_data = {}
    end

    def tmp_directory
      @tmp_directory ||= begin
        f = File.join( Rails.root, 'tmp', Time.now.strftime('export%Y%m%d%H%M%S') )
        Dir.mkdir(f) unless Dir[f].present?
        f
      end
    end

    def json_output_stream
      @json_output_stream ||= File.new( File.join( tmp_directory, 'tables.json' ), 'w+b' )
    end

    def write_schema_info(args)
      raise SchemaArgumentsError unless args[:source].present? && args[:version].present?

      @schema_data = {
          schema: {
            source: args[:source],
            version: args[:version]
          }
        }
    end

    def write_table(table_name, columns)
      @table_data[table_name] ||= {}
      @table_data[table_name][:fields] = columns.map(&:name)
      @table_data[table_name][:rows] ||= []

      row_count = 0
      begin
        rows = yield(row_count)
        if rows
          row_count += rows.size
          @table_data[table_name][:rows] << rows
        end

        # TODO: write to multiple files as needed.
        #       one file per table? multiple files per table?

      end while rows && rows.size > 0

      @table_data[table_name][:rows].flatten!(1)
      @table_data[table_name][:row_count] = @table_data[table_name][:rows].size
    end

    def finish
      @schema_data[:schema][:table_count] = @table_data.keys.count
      json_output_stream.write( Oj.dump(@schema_data.merge(@table_data),
                                        :mode => :compat) )
      json_output_stream.close

      @filenames = [File.join( tmp_directory, 'tables.json' )]
    end

    def filenames
      @filenames ||= []
    end

    def cleanup_temp
      FileUtils.rm_rf(tmp_directory) if Dir[tmp_directory].present?
    end
  end
end
