export
type I_oauth_error__get_token
	= 'empty code'
	| 'connection error'
	| 'invalid response from oauth provider'
	| 'invalid code'
	| 'incorrect client credentials'

export
type I_oauth_error__get_id
	= 'connection error'
	| 'invalid response from oauth provider'
	| 'invalid token'

export
type I_oauth_error = I_oauth_error__get_token | I_oauth_error__get_id
