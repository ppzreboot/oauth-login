export
enum OAUTH_ERROR__GET_TOKEN {
    invalid_code = 1,
    got_invalid_token,
}

export
enum OAUTH_ERROR__GET_USERINFO {
    invalid_token = 1001,
}

export
type OAUTH_ERROR = OAUTH_ERROR__GET_TOKEN | OAUTH_ERROR__GET_USERINFO
