# A Factory #

The problem:  We need strategies for dealing with large amounts of data needed for tests.

Solution #1:  Model constraints inside factories.

1. Create a model factory and specify your requirements.

        function genericProduct() {
            return m.Production.Product()
                .withProductNumber(randomProductNumber())
                .withWeightUnitMeasureCode('KG')
                .withSizeUnitMeasureCode('EA')
                .withSafetyStockLevel(1)
                .withDiscontinuedDate(null);
        }

2. Manipulate buyers returned from your factory just like you did before!

        var lifeJacket = genericProduct().withName('Life Jacket');
        var saltines = genericProduct().withName('Saltines');

        createAsync(saltines)
        createAsync(lifeJacket)

3. You have new buyers!

Factories like this are a great way to write descriptive code, but let's you hide the details behind the factory.

[Create Your Model](promise_example.md)


[Back to the intro](intro.md)
