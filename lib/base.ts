import { encodeBase64Url } from '@std/encoding'
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

	private generate_random_byte(len: number) {
		const random = new Uint8Array(len) // 生成 len 字节的容器
		crypto.getRandomValues(random) // 生成 len 字节的随机数据
		return encodeBase64Url(random) // 转化成 url 安全的字符串
	}

	private async generate_challenge(verifier: string) {
		const v = new TextEncoder().encode(verifier) // string -> binary
		const hash = await crypto.subtle.digest('SHA-256', v) // hash(binary)
		return encodeBase64Url(hash) // hashed_binary -> base64url
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
