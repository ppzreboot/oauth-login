export
enum OAUTH_ERROR__GET_TOKEN {
    empty_code = 1,
    invalid_code,
    incorrect_client_credentials,
    got_invalid_token,
    unknown,
}

export
enum OAUTH_ERROR__GET_USERINFO {
    invalid_token = 1001,
    unknown,
}

export
type OAUTH_ERROR = OAUTH_ERROR__GET_TOKEN | OAUTH_ERROR__GET_USERINFO
