import type { I_oauth_error__get_token, I_oauth_error__get_id, I_oauth_error } from './type.ts'
import {
	retrieve_json_body,
	is_real_str,
	type I_async_result,
	type I_result_error_with_key,
	error_result,
} from './ppz/index.ts'

/** GitHub's authorization page. */
export
function get_github_login_url(client_id: string): string {
	return 'https://github.com/login/oauth/authorize?client_id=' + client_id
}

/** Exchange access token with authorization code. */
export
async function get_token_by_code(code: string, client_id: string, client_secret: string): I_async_result<string, I_result_error_with_key<I_oauth_error__get_token>>
{
	if (code.length === 0)
		return error_result('empty code', null)

	const response = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			client_id,
			client_secret,
			code,
		}),
	})
	const response_result = await retrieve_json_body(response)
	if (response_result.ok === false) {
		if (response_result.error.key === 'connection error')
			return error_result('connection error', response_result.error.error)
		else
			return error_result('invalid response from oauth provider', response_result.error.error)
	}

	const data = response_result.value as { error?: string, access_token?: unknown }

	switch (data.error) {
		case 'bad_verification_code':
			return error_result('invalid code', data)
		case 'incorrect_client_credentials':
			return error_result('incorrect client credentials', data)
		case undefined: {
			const access_token = data.access_token
			if (is_real_str(access_token))
				return { ok: true, value: access_token }
			return error_result('invalid response from oauth provider', data)
		}
		default:
			return error_result('invalid response from oauth provider', data)
	}
}

/** Exchange userid with access token . */
export
async function get_userid_by_token(access_token: string):
	I_async_result<number, I_result_error_with_key<I_oauth_error__get_id>>
{
	const response = await fetch('https://api.github.com/user', {
		method: 'GET',
		headers: {
			Authorization: 'Bearer ' + access_token,
		},
	})
	const response_result = await retrieve_json_body(response)
	if (response_result.ok === false) {
		if (response_result.error.key === 'connection error')
			return error_result('connection error', response_result.error.error)
		else
			return error_result('invalid response from oauth provider', response_result.error.error)
	}
	const data = response_result.value as { message?: string, id?: unknown }
	if (data.message === 'Bad credentials')
		return error_result('invalid token', data)
	if (data.message === undefined && typeof(data.id) === 'number')
		return { ok: true, value: data.id }
	return error_result('invalid response from oauth provider', data)
}

/** Exchange userid with authentication code. */
export
async function get_userinfo_by_code(code: string, client_id: string, client_secret: string):
	I_async_result<number, I_result_error_with_key<I_oauth_error>>
{
	const result = await get_token_by_code(code, client_id, client_secret)
	if (result.ok === false)
		return result
	return await get_userid_by_token(result.value)
}
