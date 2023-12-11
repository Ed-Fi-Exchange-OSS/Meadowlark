# Rate Limiting for OAuth

To prevent a possible attack, we want to limit the users from authenticating
multiple times in a short period of time, this can be done with the load
balancer. As an example, we will use the NGINX
[sample-load-balancer](../../Meadowlark-js/sample-load-balancer.conf)

## Configuration

NGINX has a built in setup of rate limiting in a configuration file per endpoint
(can be done at a higher level). See
https://www.nginx.com/blog/rate-limiting-nginx/ for guidance, and the
[documentation](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req)

### Setup

1. Define the `limit_req_zone` at the beginning of the
   [file](../../Meadowlark-js/sample-load-balancer.conf#L1). The zone means the
   memory used to save IP addresses, and the `rate` represent how often the
   count will be restarted (every minute).

2. For the desired endpoint, specify the `limit_req` with the name of the zone
   specified in the previous step, and the `burst` which is the amount of time
   allowed per time period (the rate). In this example, we set the `rate` to 1
   minute and the `burst` to 3 requests during that minute.

3. Start Meadowlark fully in Docker, using MongoDB as the backend and OpenSearch
   as the search provider.

   ```pwsh
   cd Meadowlark-js
   ./reset-docker-compose.ps1
   ```

With this setup, the endpoint will have the request limit in place, which is the
recommended approach with a load balancer or front end proxy.
