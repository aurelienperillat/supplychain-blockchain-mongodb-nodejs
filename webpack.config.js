const path = require('path');
var webpack = require("webpack");

module.exports = {
    entry: {
        login: "./public/js/loginPackage.js",
        admin: "./public/js/adminPackage.js",
        adminCatalogue: "./public/js/adminCataloguePackage.js",
        fournisseurCatalogue: "./public/js/fournisseurCataloguePackage.js",
        client: "./public/js/clientPackage.js",
        clientCatalogue: "./public/js/clientCataloguePackage.js",
        transporteur: "./public/js/transporteurPackage.js"
    },
    target: 'web',
    output: {
        path: path.resolve(__dirname, "public/build/bundles"),
        filename: "[name]Bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.json$/,
                use: 'json-loader'
            },
            {
                test: /\.node$/,
                use: 'node-loader'
            },
            {
                test: /\.(html)$/,
                use: {
                    loader: 'html-loader',
                    options: {
                        attrs: [':data-src']
                    }
                }
            }
        ],
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery",
            "window.jQuery": "jquery",
            Tether: "tether",
            "window.Tether": "tether",
            Alert: "exports-loader?Alert!bootstrap/js/dist/alert",
            Button: "exports-loader?Button!bootstrap/js/dist/button",
            Carousel: "exports-loader?Carousel!bootstrap/js/dist/carousel",
            Collapse: "exports-loader?Collapse!bootstrap/js/dist/collapse",
            Dropdown: "exports-loader?Dropdown!bootstrap/js/dist/dropdown",
            Modal: "exports-loader?Modal!bootstrap/js/dist/modal",
            Popover: "exports-loader?Popover!bootstrap/js/dist/popover",
            Scrollspy: "exports-loader?Scrollspy!bootstrap/js/dist/scrollspy",
            Tab: "exports-loader?Tab!bootstrap/js/dist/tab",
            Tooltip: "exports-loader?Tooltip!bootstrap/js/dist/tooltip",
            Util: "exports-loader?Util!bootstrap/js/dist/util",
        }),
        new webpack.IgnorePlugin(/vertx/)
    ]
};