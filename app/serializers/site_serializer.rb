class SiteSerializer < ApplicationSerializer

  attributes :default_archetype,
             :notification_types,
             :post_types,
             :uncategorized_slug

  has_many :categories, serializer: BasicCategorySerializer, embed: :objects
  has_many :post_action_types, embed: :objects
  has_many :trust_levels, embed: :objects
  has_many :archetypes, embed: :objects, serializer: ArchetypeSerializer


  def default_archetype
    Archetype.default
  end

  def post_types
    Post.types
  end

  def uncategorized_slug
    Slug.for(SiteSetting.uncategorized_name)
  end

end
