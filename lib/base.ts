import {
	type I_result,
	type I_async_result,
	type I_result_error_with_key,
	error_result,
} from '@ppz/ppz'
import type {
	I_oauth_error__get_token__callback_opts,
	I_oauth_error__get_token,
	I_oauth_error__get_id,
	I_oauth_error,
	I_callback_opts,
	I_oauth_prep,
} from './type.ts'

export
abstract class OAuth {
	protected constructor(
		protected readonly client_id: string,
		protected readonly client_secret: string,
		protected readonly redirect_uri: string,
		private readonly auth_url: string,
	) {}

	private uint8_array_to_base64(array: Uint8Array) {
		const random_str = String.fromCharCode(...array) // 转换为 ASCII 字符串 (每个 ASCII 就是一个 byte)
		const challenge = btoa(random_str) // len 个 byte => len * 8 bit => len * 8 / 6 个 base64 (每个 base64 == 6 bit)
		return challenge
			.replace(/\+/g, '-') // 替换“属于 base64”但不适用于 URL 的字符
			.replace(/\//g, '_')
			.replace(/=+$/, '')
	}
	private generate_random_byte(len: number) {
		const random = new Uint8Array(len)
		crypto.getRandomValues(random) // 生成 len 字节的数据
		return this.uint8_array_to_base64(random)
	}

	private async generate_challenge(verifier: string) {
		const v = new TextEncoder().encode(verifier)
		const hash = await crypto.subtle.digest('SHA-256', v)
		return this.uint8_array_to_base64(new Uint8Array(hash))
	}

	/** Prepare the oauth process. */
	async prepare_oauth(): Promise<I_oauth_prep> {
		const state = this.generate_random_byte(16)
		const challenge_verifier = this.generate_random_byte(32)
		const challenge = await this.generate_challenge(challenge_verifier)
		const url = new URL(this.auth_url)
		url.searchParams.set('client_id', this.client_id)
		url.searchParams.set('redirect_uri', this.redirect_uri)
		url.searchParams.set('state', state)
		url.searchParams.set('code_challenge', challenge)
		url.searchParams.set('code_challenge_method', 'S256')
		url.searchParams.set('response_type', 'code')
		return {
			url,
			state,
			challenge_verifier,
		}
	}

	protected check_callback_opts(opts: I_callback_opts):
		I_result<null, I_result_error_with_key<I_oauth_error__get_token__callback_opts>>
	{
		if (opts.auth_code === null || opts.auth_code.length === 0)
			return error_result('empty auth code', null)
		if (opts.state.from_session === undefined || opts.state.from_session.length === 0 || opts.state.from_url !== opts.state.from_session)
			return error_result('CSRF attack', null)
		if (!opts.challenge_verifier)
			return error_result('empty challenge verifier', null)
		return { ok: true, value: null }
	}

	/** Exchange access token with authorization code. */
	abstract get_token_by_code(opts: I_callback_opts):
		I_async_result<string, I_result_error_with_key<I_oauth_error__get_token>>
	/** Exchange userid with access token . */
	abstract get_userid_by_token(access_token: string):
		I_async_result<number, I_result_error_with_key<I_oauth_error__get_id>>
	/** Exchange userid with authentication code. */
	abstract get_userid_by_code(opts: I_callback_opts):
		I_async_result<number, I_result_error_with_key<I_oauth_error>>
}
