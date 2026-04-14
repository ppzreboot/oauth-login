import { assertEquals } from '@std/assert'
import {
	get_github_login_url,
	get_token_by_code,
	get_userid_by_token,
	get_userid_by_code,
} from './github.ts'

const client_id = Deno.env.get('github_client_id')
const client_secret = Deno.env.get('github_client_secret')
if (!client_id || !client_secret)
	throw new Error('github_client_id and github_client_secret must be set')

Deno.test('get_github_login_url', () => {
	const url = get_github_login_url('abc123')
	assertEquals(url, 'https://github.com/login/oauth/authorize?client_id=abc123')
})

Deno.test('get_token_by_code', async t => {
	await t.step('error: empty auth code', async () => {
		const result = await get_token_by_code('', 'id', 'secret')
		assertEquals(result.ok, false)
		if (!result.ok)
			assertEquals(result.error.key, 'empty auth code')
	})
	await t.step('error: bad auth code', async () => {
		const result = await get_token_by_code('bad', client_id, client_secret)
		assertEquals(result.ok, false)
		if (result.ok === false)
			assertEquals(result.error.key, 'invalid auth code')
	})
	await t.step('error: maybe incorrect client id', async () => {
		const result = await get_token_by_code('code', 'bad-id', 'bad-secret')
		assertEquals(result.ok, false)
		if (!result.ok)
			assertEquals(result.error.key, 'maybe incorrect client id')
	})
	await t.step('error: incorrect_client_secret', async () => {
		const result = await get_token_by_code('code', client_id, 'bad-secret')
		assertEquals(result.ok, false)
		if (!result.ok)
			assertEquals(result.error.key, 'incorrect client secret')
	})
})


Deno.test('get_userid_by_token: invalid access token', async () => {
	const result = await get_userid_by_token('bad-token')
	assertEquals(result.ok, false)
	if (!result.ok)
		assertEquals(result.error.key, 'invalid access token')
})

Deno.test('get_userid_by_code', async t => {
	await t.step('error: empty auth code', async () => {
		const result = await get_userid_by_code('', 'id', 'secret')
		assertEquals(result.ok, false)
		if (!result.ok)
			assertEquals(result.error.key, 'empty auth code')
	})
	await t.step('error: bad auth code', async () => {
		const result = await get_userid_by_code('bad code', client_id, client_secret)
		assertEquals(result.ok, false)
		if (!result.ok)
			assertEquals(result.error.key, 'invalid auth code')
	})
	await t.step('error: bad client id', async () => {
		const result = await get_userid_by_code('bad', 'bad id', client_secret)
		assertEquals(result.ok, false)
		if (result.ok === false)
			assertEquals(result.error.key, 'maybe incorrect client id')
	})
	await t.step('error: bad client secret', async () => {
		const result = await get_token_by_code('code', client_id, 'bad-secret')
		assertEquals(result.ok, false)
		if (!result.ok)
			assertEquals(result.error.key, 'incorrect client secret')
	})
})
