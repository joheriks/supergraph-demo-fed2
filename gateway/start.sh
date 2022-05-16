#!/bin/sh
certbot certonly -m johannes@stepzen.com --standalone -d apollo.graphqlize.net -n --agree-tos
node gateway.js
