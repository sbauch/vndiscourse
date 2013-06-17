require 'digest/sha1'
require 'image_sizer'
require 's3'
require 'local_store'
require 'tempfile'
require 'pathname'

class Upload < ActiveRecord::Base
  belongs_to :user

  has_many :post_uploads
  has_many :posts, through: :post_uploads

  has_many :optimized_images

  validates_presence_of :filesize
  validates_presence_of :original_filename

<<<<<<< HEAD
  def self.create_for(user_id, file, topic_id)
    return create_on_imgur(user_id, file, topic_id) if SiteSetting.enable_imgur?
    return create_on_s3(user_id, file, topic_id) if SiteSetting.enable_s3_uploads?
    return create_locally(user_id, file, topic_id)
=======
  def thumbnail
    @thumbnail ||= optimized_images.where(width: width, height: height).first
>>>>>>> 4de0c58b834664c3220deb58202d1ccd14053fef
  end

  def thumbnail_url
    thumbnail.url if has_thumbnail?
  end

<<<<<<< HEAD
  # Store uploads on s3
  def self.create_on_s3(user_id, file, topic_id)
    @fog_loaded = require 'fog' unless @fog_loaded

    tempfile = file.tempfile

    upload = Upload.new(user_id: user_id,
                        topic_id: topic_id,
                        filesize: File.size(tempfile),
                        original_filename: file.original_filename)

    image_info = FastImage.new(tempfile)
    blob = file.read
    sha1 = Digest::SHA1.hexdigest(blob)

    Fog.credentials_path = "#{Rails.root}/config/fog_credentials.yml"
    fog = Fog::Storage.new(provider: 'AWS')

    remote_filename = "#{sha1[2..-1]}.#{image_info.type}"
    path = "/uploads/#{sha1[0]}/#{sha1[1]}"
    location = "#{SiteSetting.s3_upload_bucket}"
    directory = fog.directories.create(key: location)

    file = directory.files.create(key: remote_filename,
                                  body: tempfile,
                                  public: true,
                                  content_type: file.content_type)
    upload.width, upload.height = ImageSizer.resize(*image_info.size)

    upload.url = "https://s3.amazonaws.com/vaynermedia-vaynernet-gifs-development/#{remote_filename}"
    # upload.url = "//#{SiteSetting.s3_upload_bucket}.s3.amazonaws.com#{path}/#{remote_filename}" # THEIRS. Had trouble with this.
=======
  def has_thumbnail?
    thumbnail.present?
  end

  def create_thumbnail!
    return unless SiteSetting.create_thumbnails?
    return unless width > SiteSetting.auto_link_images_wider_than
    return if has_thumbnail?
    thumbnail = OptimizedImage.create_for(self, width, height)
    optimized_images << thumbnail if thumbnail
  end

  def self.create_for(user_id, file)
    # compute the sha
    sha = Digest::SHA1.file(file.tempfile).hexdigest
    # check if the file has already been uploaded
    upload = Upload.where(sha: sha).first

    # otherwise, create it
    if upload.blank?
      # retrieve image info
      image_info = FastImage.new(file.tempfile, raise_on_failure: true)
      # compute image aspect ratio
      width, height = ImageSizer.resize(*image_info.size)
      # create a db record (so we can use the id)
      upload = Upload.create!({
        user_id: user_id,
        original_filename: file.original_filename,
        filesize: File.size(file.tempfile),
        sha: sha,
        width: width,
        height: height,
        url: ""
      })
      # make sure we're at the beginning of the file (FastImage is moving the pointer)
      file.rewind
      # store the file and update its url
      upload.url = Upload.store_file(file, sha, image_info, upload.id)
      # save the url
      upload.save
    end
    # return the uploaded file
    upload
  end
>>>>>>> 4de0c58b834664c3220deb58202d1ccd14053fef

  def self.store_file(file, sha, image_info, upload_id)
    return S3.store_file(file, sha, image_info, upload_id) if SiteSetting.enable_s3_uploads?
    return LocalStore.store_file(file, sha, image_info, upload_id)
  end

  def self.uploaded_regex
    /\/uploads\/#{RailsMultisite::ConnectionManagement.current_db}\/(?<upload_id>\d+)\/[0-9a-f]{16}\.(png|jpg|jpeg|gif|tif|tiff|bmp)/
  end

<<<<<<< HEAD
  def thumbnail
    @thumbnail ||= optimized_images.where(width: width, height: height).first
  end

  def thumbnail_url
    thumbnail.url if has_thumbnail?
  end

  def has_thumbnail?
    thumbnail.present?
  end

  def create_thumbnail!
    return unless SiteSetting.create_thumbnails?
    return unless width > SiteSetting.auto_link_images_wider_than
    return if has_thumbnail?
    thumbnail = OptimizedImage.create_for(self, width, height)
    optimized_images << thumbnail if thumbnail
  end

  def self.create_for(user_id, file)
    # compute the sha
    sha = Digest::SHA1.file(file.tempfile).hexdigest
    # check if the file has already been uploaded
    upload = Upload.where(sha: sha).first

    # otherwise, create it
    if upload.blank?
      # retrieve image info
      image_info = FastImage.new(file.tempfile, raise_on_failure: true)
      # compute image aspect ratio
      width, height = ImageSizer.resize(*image_info.size)
      # create a db record (so we can use the id)
      upload = Upload.create!({
        user_id: user_id,
        original_filename: file.original_filename,
        filesize: File.size(file.tempfile),
        sha: sha,
        width: width,
        height: height,
        url: ""
      })
      # make sure we're at the beginning of the file (FastImage is moving the pointer)
      file.rewind
      # store the file and update its url
      upload.url = Upload.store_file(file, sha, image_info, upload.id)
      # save the url
      upload.save
    end
    # return the uploaded file
    upload
=======
  def self.has_been_uploaded?(url)
    (url =~ /^\/[^\/]/) == 0 || url.start_with?(base_url)
  end

  def self.base_url
    asset_host.present? ? asset_host : Discourse.base_url_no_prefix
  end

  def self.asset_host
    ActionController::Base.asset_host
>>>>>>> 4de0c58b834664c3220deb58202d1ccd14053fef
  end

  def self.store_file(file, sha, image_info, upload_id)
    return S3.store_file(file, sha, image_info, upload_id) if SiteSetting.enable_s3_uploads?
    return LocalStore.store_file(file, sha, image_info, upload_id)
  end

  def self.uploaded_regex
    /\/uploads\/#{RailsMultisite::ConnectionManagement.current_db}\/(?<upload_id>\d+)\/[0-9a-f]{16}\.(png|jpg|jpeg|gif|tif|tiff|bmp)/
  end

  def self.has_been_uploaded?(url)
    (url =~ /^\/[^\/]/) == 0 || url.start_with?(base_url)
  end

  def self.base_url
    asset_host.present? ? asset_host : Discourse.base_url_no_prefix
  end

  def self.asset_host
    ActionController::Base.asset_host
  end

end

# == Schema Information
#
# Table name: uploads
#
#  id                :integer          not null, primary key
#  user_id           :integer          not null
#  original_filename :string(255)      not null
#  filesize          :integer          not null
#  width             :integer
#  height            :integer
#  url               :string(255)      not null
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  sha               :string(255)
#
# Indexes
#
#  index_uploads_on_sha      (sha) UNIQUE
#  index_uploads_on_user_id  (user_id)
#

