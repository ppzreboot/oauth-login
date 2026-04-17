import { assertEquals, assert } from '@std/assert'
import { GitHubOAuth } from './github.ts'

const client_id = Deno.env.get('github_client_id')
const client_secret = Deno.env.get('github_client_secret')
const redirect_uri = Deno.env.get('github_redirect_uri')

if (!client_id || !client_secret || !redirect_uri)
	throw new Error('github_client_id and github_client_secret must be set')

const github_oauth = new GitHubOAuth(client_id, client_secret, redirect_uri)

Deno.test('GitHub OAuth', async t => {
	await t.step('preparation', async t => {
		const oauth_prep = await github_oauth.prepare_oauth()
		await t.step('default redirect_uri', () => {
			assertEquals(oauth_prep.url.searchParams.get('redirect_uri'), redirect_uri)
		})
		await t.step('state', () => {
			assertEquals(oauth_prep.state.length, 22) // 16 bytes => 128 bits => 128 / 6 = 21.3333 => 22 base64
		})
		await t.step('challenge', () => {
			assertEquals(oauth_prep.challenge_verifier.length, 43)
			assertEquals(oauth_prep.url.searchParams.get('code_challenge')!.length, 43)
			assertEquals(oauth_prep.url.searchParams.get('code_challenge_method'), 'S256')
		})
	})

	await t.step('get_userid_by_code', async t => {
		await t.step('error: bad callback opts', async t => {
			await t.step('empty auth code', async () => {
				const result = await github_oauth.get_userid_by_code({
					auth_code: '',
					state: {
						from_url: '123',
						from_session: '123',
					},
					challenge_verifier: '',
				})
				assert(result.ok === false)
				assertEquals(result.error.key, 'empty auth code')
			})
			await t.step('CSRF attack', async t => {
				await t.step('empty state', async () => {
					const result = await github_oauth.get_userid_by_code({
						auth_code: 'code',
						state: { from_url: '', from_session: '' },
						challenge_verifier: '',
					})
					assert(result.ok === false)
					assertEquals(result.error.key, 'CSRF attack')
				})
				await t.step('different state', async () => {
					const result = await github_oauth.get_userid_by_code({
						auth_code: 'code',
						state: {
							from_url: 'abc',
							from_session: 'def',
						},
						challenge_verifier: '',
					})
					assert(result.ok === false)
					assertEquals(result.error.key, 'CSRF attack')
				})
			})
		})
		await t.step('error: bad auth code', async () => {
			const result = await github_oauth.get_userid_by_code({
				auth_code: 'bad code',
				state: { from_url: '123', from_session: '123' },
				challenge_verifier: '123',
			})
			assert(result.ok === false)
			assert(result.error.key === 'invalid auth code')
		})
		await t.step('error: maybe incorrect client id', async () => {
			const github_oauth = new GitHubOAuth('bad-id', 'bad-secret', 'http://localhost/')
			const result = await github_oauth.get_userid_by_code({
				auth_code: 'code',
				state: { from_url: '123', from_session: '123' },
				challenge_verifier: '123',
			})
			assert(result.ok === false)
			assertEquals(result.error.key, 'maybe incorrect client id')
		})
		await t.step('error: incorrect_client_secret', async () => {
			const github_oauth = new GitHubOAuth(client_id, 'bad-secret', 'http://localhost/')
			const result = await github_oauth.get_userid_by_code({
				auth_code: 'code',
				state: { from_url: '123', from_session: '123' },
				challenge_verifier: '123',
			})
			assert(result.ok === false)
			assertEquals(result.error.key, 'incorrect client secret')
		})
	})

	await t.step('get_userid_by_token: invalid access token', async () => {
		const result = await github_oauth.get_userid_by_token('bad-token')
		assert(result.ok === false)
		assertEquals(result.error.key, 'invalid access token')
	})
})
