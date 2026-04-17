import {
	parse_json,
	is_real_str,
	type I_async_result,
	type I_result_error_with_key,
	error_result,
} from './ppz/index.ts'
import type {
	I_oauth_error__get_token,
	I_oauth_error__get_id,
	I_oauth_error,
	I_callback_opts,
} from './type.ts'
import { OAuth } from './base.ts'

export
class GitHubOAuth extends OAuth {
	constructor(client_id: string, client_secret: string, redirect_uri: string) {
		super(client_id, client_secret, redirect_uri, 'https://github.com/login/oauth/authorize')
	}
	async get_token_by_code(opts: I_callback_opts):
		I_async_result<string, I_result_error_with_key<I_oauth_error__get_token>>
	{
		const right_opts = this.check_callback_opts(opts)
		if (right_opts.ok === false)
			return right_opts

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
					client_id: this.client_id,
					client_secret: this.client_secret,
					code: opts.auth_code,
					redirect_uri: opts.redirect_uri,
					code_verifier: opts.challenge_verifier,
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

	async get_userid_by_token(access_token: string):
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

	async get_userid_by_code(opts: I_callback_opts):
		I_async_result<number, I_result_error_with_key<I_oauth_error>>
	{
		const result = await this.get_token_by_code(opts)
		if (result.ok === false)
			return result
		return await this.get_userid_by_token(result.value)
	}
}
