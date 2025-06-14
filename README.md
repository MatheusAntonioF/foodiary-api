# Foodiary API

## What I have learned so far

-   Decorator design pattern

This design pattern allow us to abstract behavior and encapsulate it to be reused across the whole application.
In order to work with it, we need to install a dependency called `reflect-metadata` and we need to update some settings in the `tsconfig.json`. Since we are compiling the code with esbuild and it does not generate the internal metadata for us we need to add two more settings in the tsconfig, they are:

-   experimentalDecorators
-   emitDecoratorMetadata

Those settings make tsc generate the metadata to be used during the runtime

Disclaimer: by default, esbuild does not generate the metadata so since we are using it to compile the code we need to provide a custom settings that is gonna extend our tsconfig, check the file `esbuild.config.mjs`
