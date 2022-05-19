// Open Telemetry (optional)
const { ApolloOpenTelemetry } = require('supergraph-demo-opentelemetry');

if (process.env.APOLLO_OTEL_EXPORTER_TYPE) {
  new ApolloOpenTelemetry({
    type: 'subgraph',
    name: 'products',
    exporter: {
      type: process.env.APOLLO_OTEL_EXPORTER_TYPE, // console, zipkin, collector
      host: process.env.APOLLO_OTEL_EXPORTER_HOST,
      port: process.env.APOLLO_OTEL_EXPORTER_PORT,
    }
  }).setupInstrumentation();
}

const { ApolloServer, gql } = require('apollo-server');
const { readFileSync } = require('fs');

const port = process.env.APOLLO_PORT || 80;

const products = [
    { id: 'stepzen-federation', sku: 'federation', package: '@steprz/federation', variation: "OSS" },
    { id: 'graphql-studio', sku: 'studio', package: '', variation: "platform" },
]

const typeDefs = gql(readFileSync('./products.graphql', { encoding: 'utf-8' }));

const bunyan = require('bunyan');

// Imports the Google Cloud client library for Bunyan
const {LoggingBunyan} = require('@google-cloud/logging-bunyan');

// Creates a Bunyan Cloud Logging client
const loggingBunyan = new LoggingBunyan();

// Create a Bunyan logger that streams to Cloud Logging
// Logs will be written to: "projects/YOUR_PROJECT_ID/logs/bunyan_log"
const logger = bunyan.createLogger({
  // The JSON payload of the log as it appears in Cloud Logging
  // will contain "name": "my-service"
  name: 'apollo-products',
  streams: [
    // Log to the console at 'info' and above
    {stream: process.stdout, level: 'info'},
    // And log to Cloud Logging, logging at 'info' and above
    loggingBunyan.stream('info'),
  ],
});


const resolvers = {
    Query: {
        allProducts: (_, args, context) => {
            logger.info("Query > allProducts", args)
            return products;
        },
        product: (_, args, context) => {
            logger.info("Query > product", args)
            return products.find(p => p.id == args.id);
        }
    },
    Product: {
        variation: (reference) => {
            logger.info("Product > variation", reference)
            if (reference.variation) return { id: reference.variation };
            return { id: products.find(p => p.id == reference.id).variation }
        },
        dimensions: () => {
            logger.info("Product > dimensions")
            return { size: "1", weight: 1 }
        },
        createdBy: (reference) => {
            logger.info("Product > createdBy", reference)
            return { email: 'support@apollographql.com', totalProductsCreated: 1337 }
        },
        __resolveReference: (reference) => {
            logger.info("Product > __resolveReference", reference)
            if (reference.id) return products.find(p => p.id == reference.id);
            else if (reference.sku && reference.package) return products.find(p => p.sku == reference.sku && p.package == reference.package);
            else return { id: 'rover', package: '@apollo/rover', ...reference };
        }
    }
}
const server = new ApolloServer({ typeDefs, resolvers });
server.listen( {port: port} ).then(({ url }) => {
  console.log(`🚀 Products subgraph ready at ${url}`);
}).catch(err => {console.error(err)});
