import type { I_oauth_error__get_token, I_oauth_error__get_id, I_oauth_error } from './type.ts'
import {
	parse_json,
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
		return error_result('empty auth code', null)

	let response: Response
	let http_body: string
	try {
		response = await fetch('https://github.com/login/oauth/access_token', {
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
		http_body = await response.text()
		// console.log(response.status, http_body)
	} catch (error) {
		return error_result('connection error', error)
	}

	const response_result = parse_json(http_body)
	if (response_result.ok) {
		const data = response_result.value as { error?: string, access_token?: unknown }
		if (response.ok && is_real_str(data.access_token))
			return { ok: true, value: data.access_token }

		switch (data.error) { // 已知异常
			case 'bad_verification_code':
				return error_result('invalid auth code', data)
			case 'incorrect_client_credentials':
				return error_result('incorrect client secret', data)
			case 'Not Found':
				if (response.status === 404)
					return error_result('maybe incorrect client id', data)
		}
	}
	// 未知异常
	return error_result('unknown error', {
		http_code: response.status,
		http_body,
	})
}

/** Exchange userid with access token . */
export
async function get_userid_by_token(access_token: string):
	I_async_result<number, I_result_error_with_key<I_oauth_error__get_id>>
{
	let response: Response
	let http_body: string
	try {
		response = await fetch('https://api.github.com/user', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer ' + access_token,
			},
		})
		http_body = await response.text()
	} catch (error) {
		return error_result('connection error', error)
	}

	const response_result = parse_json(http_body)
	if (response_result.ok) {
		const data = response_result.value as { message?: string, id?: number }
		if (response.ok && Number.isSafeInteger(data.id))
			return { ok: true, value: data.id as number }
		if (data.message === 'Bad credentials')
			return error_result('invalid access token', { data })
	}
	return error_result('unknown error', {
		http_code: response.status,
		http_body,
	})
}

/** Exchange userid with authentication code. */
export
async function get_userid_by_code(code: string, client_id: string, client_secret: string):
	I_async_result<number, I_result_error_with_key<I_oauth_error>>
{
	const result = await get_token_by_code(code, client_id, client_secret)
	if (result.ok === false)
		return result
	return await get_userid_by_token(result.value)
}
