export
type I_oauth_error__get_token
	= 'empty code'
	| 'connection error'
	| 'invalid code'
	| 'incorrect client credentials'
	| 'unknown error'

export
type I_oauth_error__get_id
	= 'connection error'
	| 'invalid access token'
	| 'unknown error'

export
type I_oauth_error = I_oauth_error__get_token | I_oauth_error__get_id
