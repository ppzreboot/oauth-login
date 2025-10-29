# OAUTH LOGIN

``` bash
npm install ppz-oauth-login
```

## Errors

##### github

+ `client id` 不对时，github 接口返回 `Not Found` 异常 => `OAUTH_ERROR__GET_TOKEN.unknown`
+ `client secret` 不对时 => `OAUTH_ERROR__GET_TOKEN.incorrect_client_credentials`
