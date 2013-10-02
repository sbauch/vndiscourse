require 'digest/sha1'
require 'open-uri'

class S3Store

  def store_upload(file, upload)
    # <id><sha1><extension>
    path = "#{upload.id}#{upload.sha1}#{upload.extension}"

    # if this fails, it will throw an exception
    upload(file.tempfile, path, file.content_type)

    # returns the url of the uploaded file
    "#{absolute_base_url}/#{path}"
  end

  def store_optimized_image(file, optimized_image)
    # <id><sha1>_<width>x<height><extension>
    path = [
      optimized_image.id,
      optimized_image.sha1,
      "_#{optimized_image.width}x#{optimized_image.height}",
      optimized_image.extension
    ].join

    # if this fails, it will throw an exception
    upload(file, path)

    # returns the url of the uploaded file
    "#{absolute_base_url}/#{path}"
  end

  def store_avatar(file, upload, size)
    # /avatars/<sha1>/200.jpg
    path = File.join(
      "avatars",
      upload.sha1,
      "#{size}#{upload.extension}"
    )

    # if this fails, it will throw an exception
    upload(file, path)

    # returns the url of the avatar
    "#{absolute_base_url}/#{path}"
  end

  def remove_upload(upload)
    remove_file(upload.url)
  end

  def remove_optimized_image(optimized_image)
    remove_file(optimized_image.url)
  end

  def remove_avatars(upload)

  end

  def remove_file(url)
    return unless has_been_uploaded?(url)
    name = File.basename(url)
    remove(name)
  end

  def has_been_uploaded?(url)
    url.start_with?(absolute_base_url)
  end

  def absolute_base_url
    "//#{s3_bucket}.s3.amazonaws.com"
  end

  def external?
    true
  end

  def internal?
    !external?
  end

  def download(upload)
    temp_file = Tempfile.new(["discourse-s3", File.extname(upload.original_filename)])
    url = (SiteSetting.use_ssl? ? "https:" : "http:") + upload.url

    File.open(temp_file.path, "wb") do |f|
      f.write open(url, "rb", read_timeout: 20).read
    end

    temp_file
  end

  private

  def s3_bucket
    SiteSetting.s3_upload_bucket.downcase
  end

  def check_missing_site_settings
    raise Discourse::SiteSettingMissing.new("s3_upload_bucket")     if SiteSetting.s3_upload_bucket.blank?
    raise Discourse::SiteSettingMissing.new("s3_access_key_id")     if SiteSetting.s3_access_key_id.blank?
    raise Discourse::SiteSettingMissing.new("s3_secret_access_key") if SiteSetting.s3_secret_access_key.blank?
  end

  def get_or_create_directory(name)
    check_missing_site_settings

    @fog_loaded ||= require 'fog'

    fog = Fog::Storage.new generate_options

    directory = fog.directories.get(name)
    directory = fog.directories.create(key: name) unless directory
    directory
  end

  def generate_options
    options = {
      provider: 'AWS',
      aws_access_key_id: SiteSetting.s3_access_key_id,
      aws_secret_access_key: SiteSetting.s3_secret_access_key,
    }
    options[:region] = SiteSetting.s3_region unless SiteSetting.s3_region.empty?
    options
  end

  def upload(file, name, content_type=nil)
    args = {
      key: name,
      public: true,
      body: file,
    }
    args[:content_type] = content_type if content_type
    directory.files.create(args)
  end

  def remove(name)
    directory.files.destroy(key: name)
  end

  def directory
    get_or_create_directory(s3_bucket)
  end

end
