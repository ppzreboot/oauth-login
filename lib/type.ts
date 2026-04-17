export
type I_oauth_error__get_token__callback_opts
	= 'empty auth code'
	| 'CSRF attack'
	| 'empty challenge verifier'

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

/**
 * Options for callback.  
 * url 里的参数  
 * `URLSearchParams.get: () => string | null`  
 * session 里的参数  
 * `getCookies: () => Record<string, string | undefined>`  
 */
export
interface I_callback_opts {
	auth_code: null | string
	challenge_verifier?: string
	state: {
		from_url: string | null
		from_session?: string
	}
}
