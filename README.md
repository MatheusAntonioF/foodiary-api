# Foodiary API

## What I have learned so far

-   Decorator design pattern

This design pattern allow us to abstract behavior and encapsulate it to be reused across the whole application.
In order to work with it, we need to install a dependency called `reflect-metadata` and we need to update some settings in the `tsconfig.json`. Since we are compiling the code with esbuild and it does not generate the internal metadata for us we need to add two more settings in the tsconfig, they are:

-   experimentalDecorators
-   emitDecoratorMetadata

Those settings make tsc generate the metadata to be used during the runtime

Disclaimer: by default, esbuild does not generate the metadata so since we are using it to compile the code we need to provide a custom settings that is gonna extend our tsconfig, check the file `esbuild.config.mjs`

-   Working with dynamo db

Dynamo is excellent tool to work with serverless specially with aws lambdas. It provides a stateless connection using http protocol instead of UTP which is a persistent protocol (stateful). To Work with dynamo is important to have a good strategy and a well defined access pattern
so we can create the Global secondary indexes to get all the values we need with less queries as possible.

When working with dynamo we need to set up the correct permissions in order to run queries and mutation into the database.

Disclaimer: We need to set up a specific permission in the role just to run queries in the Global Secondary Indexes, only the default one with `dynamodb:Query` is not enough

```
# Both ways will work

- !Join ["", [!GetAtt MainTable.Arn, "/index/*"]]
- !Sub "${MainTable.Arn}/index/*"
```

### Scripts

-   Deploy

`sls deploy`

-   Deploy function

`sls deploy function -f <function_name>`

-   Check cloudwatch logs

`sls logs -f <function_name> -t`

`-t` means tail, the end of the logs
