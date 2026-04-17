export
type I_oauth_error__get_token__callback_opts = 'empty auth code' | 'CSRF attack'
export
type I_oauth_error__get_token
	= I_oauth_error__get_token__callback_opts
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

export
interface I_callback_opts {
	auth_code: string
	redirect_uri: string
	state: {
		from_url: string
		from_session: string
	}
	challenge_verifier: string
}
