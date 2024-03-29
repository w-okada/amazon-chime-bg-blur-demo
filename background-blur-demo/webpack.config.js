const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "development",
    //mode: "production",
    entry: path.resolve(__dirname, "src/index.tsx"),
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "index.js",
    },
    resolve: {
        modules: [path.resolve(__dirname, "node_modules")],
        extensions: [".ts", ".tsx", ".js"],
    },
    module: {
        rules: [
            {
                test: [/\.ts$/, /\.tsx$/],
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env", "@babel/preset-react", "@babel/preset-typescript"],
                            plugins: ["@babel/plugin-transform-runtime"],
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "public/index.html"),
            filename: "./index.html",
        }),
    ],
    devServer: {
        proxy: {
            "/": {
                target: "http://localhost:8888",
                bypass: function (req, _res, _proxyOptions) {
                    if (req.headers.accept && req.headers.accept.indexOf("html") !== -1) {
                        return `/index.html`;
                    }
                },
            },
        },
        static: {
            directory: path.join(__dirname, "dist"),
        },
        devMiddleware: {
            index: `index.html`,
            writeToDisk: true,
        },
        liveReload: true,
        hot: false,
        host: "0.0.0.0",
        port: 9000,
        https: true,
        historyApiFallback: true,
    },
};
