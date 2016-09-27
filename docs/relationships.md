# Relationships... Let's be friends #

The problem:

Our models have relationships to other models.  Sometimes we want to specify the relationships, othertimes we want Nitro to handle it for us.


The solution:

With Nitro you can specify the relationships you want in a variety of ways, or omit it all together and let Nitro take care of it for you.

1. As with other fields, Nitro will "fill in" a field for you if you don't supply a value.  The default behavior of Nitro is to pick a random entry from the target table.  You can specify a value the exact same way you do with other fields.

        var subCategoryModel = m.Production.ProductSubcategory().withProductCategoryId(3);

The drawback to this approach is you have to know the `id` already.  Many times you won't.

2. Another option is to use nested models.

        var categoryModel = m.Production.ProductCategory().withName('Clothing');
        var subCategoryModel = m.Production.withProductCategory(categoryModel);

Note that we used `.withProductCategory` and not `.withProductCategoryId` in this example.

[Let's put all these together!](makers.md)

[Back to the intro](intro.md)
