#!/bin/bash

# Wait for Elasticsearch to start
until curl -s -u elastic:password http://localhost:9200/_cluster/health | grep -q '"status":"green"'; do
  echo "Waiting for Elasticsearch to start..."
  sleep 5
done

# Create a new user
curl -u elastic:password -X POST "http://localhost:9200/_security/user/kibana_user" -H 'Content-Type: application/json' -d'
{
  "password": "password",
  "roles": ["kibana_system"],
  "full_name": "Kibana User",
  "email": "kibana_user@example.com"
}
'