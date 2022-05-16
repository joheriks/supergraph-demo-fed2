// Open Telemetry (optional)
const { ApolloOpenTelemetry } = require('supergraph-demo-opentelemetry');

if (process.env.APOLLO_OTEL_EXPORTER_TYPE) {
  new ApolloOpenTelemetry({
    type: 'router',
    name: 'router',
    exporter: {
      type: process.env.APOLLO_OTEL_EXPORTER_TYPE, // console, zipkin, collector
      host: process.env.APOLLO_OTEL_EXPORTER_HOST,
      port: process.env.APOLLO_OTEL_EXPORTER_PORT,
    }
  }).setupInstrumentation();
}

// Main
const { ApolloServer } = require('apollo-server-express');
const { ApolloServerPluginUsageReporting } = require('apollo-server-core');
const { ApolloGateway } = require('@apollo/gateway');
const { readFileSync } = require('fs');

const port = process.env.APOLLO_PORT || 4000;
const embeddedSchema = process.env.APOLLO_SCHEMA_CONFIG_EMBEDDED == "true" ? true : false;

const config = {};
const plugins = [];

if (embeddedSchema){
  const supergraph = "/etc/config/supergraph.graphql"
  config['supergraphSdl'] = readFileSync(supergraph).toString();
  console.log('Starting Apollo Gateway in local mode ...');
  console.log(`Using local: ${supergraph}`)
} else {
  console.log('Starting Apollo Gateway in managed mode ...');
  plugins.push(
    ApolloServerPluginUsageReporting({
      fieldLevelInstrumentation: 0.01
    }));
}

const gateway = new ApolloGateway(config);

const server = new ApolloServer({
  gateway,
  debug: true,
  // Subscriptions are unsupported but planned for a future Gateway version.
  subscriptions: false,
  plugins
});

//server.listen( {port: port} ).then(({ url }) => {
//  console.log(`🚀 Graph Router ready at ${url}`);
//}).catch(err => {console.error(err)});

const express = require('express');
const { createServer } = require('https');
const fs = require('fs');

server.start().then( async () => {
    const app = express();
	server.applyMiddleware({ app });
	
	const key = '/etc/letsencrypt/live/apollo.graphqlize.net/privkey.pem'
	const cert = '/etc/letsencrypt/live/apollo.graphqlize.net/fullchain.pem'

	httpServer = createServer(
		{
		  key: fs.readFileSync(key),
		  cert: fs.readFileSync(cert),
  		}, app);

	await new Promise(resolve =>
		httpServer.listen({ port: 443 }, resolve),
	);

	console.log('🚀 Server ready at port 443');
});
