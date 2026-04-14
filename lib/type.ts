export
type I_oauth_error__get_token
	= 'empty auth code'
	| 'connection error'
	| 'invalid auth code'
	| 'maybe incorrect client id'
	| 'incorrect client secret'
	| 'unknown error'

export
type I_oauth_error__get_id
	= 'connection error'
	| 'invalid access token'
	| 'unknown error'

export
type I_oauth_error = I_oauth_error__get_token | I_oauth_error__get_id
