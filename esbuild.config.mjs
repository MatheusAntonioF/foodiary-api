import esbuildPluginTsc from "esbuild-plugin-tsc";

/**
 * This file is required cause of a limitation of esbuild
 *
 * when we use decorators there are some internal metadata exported by typescript during the
 * compilation
 * those metadata are not exported by esbuild cause it does not run a type checking
 * which is required for the decorator to work
 *
 * so we need to install the plugin esbuild-plugin-tsc to export the metadata
 *
 * and this file is created to be imported in the serverless.yml
 */
export default () => {
    return {
        bundle: true,
        minify: true,
        sourcemap: false,
        exclude: ["@aws-sdk/*"],
        external: ["@aws-sdk/*"],
        plugins: [
            esbuildPluginTsc({
                tsconfig: "tsconfig.json",
            }),
        ],
    };
};
