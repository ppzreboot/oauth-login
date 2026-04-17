import { getCookies, setCookie } from '@std/http/cookie'
import { GitHubOAuth } from '../lib/github.ts'

const client_id = Deno.env.get('github_client_id')
const client_secret = Deno.env.get('github_client_secret')
const redirect_uri = Deno.env.get('github_redirect_uri')

if (client_id === undefined || client_secret === undefined || redirect_uri === undefined)
	throw new Error('github_client_id, github_client_secret and github_redirect_uri are required')

const oauth = new GitHubOAuth(client_id, client_secret, redirect_uri)
const oauth_state_key = 'oauth_state'
const oauth_challenge_verifier_key = 'oauth_challenge_verifier'
const session_key = 'session_id'
const get_cookies = (headers: Headers): Record<string, string | undefined> =>
	getCookies(headers)
const set_cookie = (headers: Headers, key: string, value: string) => {
	setCookie(headers, {
		name: key,
		value,
		httpOnly: true,
		// secure: true,
		path: '/',
		maxAge: 60,
		sameSite: 'Lax',
	})
}

function page_html(userid: number | null) {
	const status = userid
		? `<p>Logged in GitHub user id: <b>${userid}</b></p>`
		: '<p>Not logged in yet.</p>'
	const page = `<!doctype html>
<html>
<head><meta charset="UTF-8"><title>GitHub OAuth Demo</title></head>
<body>
  <h1>GitHub OAuth Demo</h1>
  ${status}
  <p><a href="/login">1) Start OAuth Login</a></p>
  <p><a href="/logout">2) Clear local session</a></p>
</body>
</html>`

	return new Response(page, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
		}
	})
}

async function handler(req: Request): Promise<Response> {
	const url = new URL(req.url)
	switch (url.pathname) {
		case '/': {
			const session_id = get_cookies(req.headers)[session_key]
			const userid = session_id === undefined ? null : Number(session_id)
			return page_html(userid)
		}
		case '/login': {
			const oauth_prep = await oauth.prepare_oauth()
			const response = new Response(null, {
				status: 302,
				headers: {
					location: oauth_prep.url.toString(),
				},
			})
			set_cookie(response.headers, oauth_state_key, oauth_prep.state)
			set_cookie(response.headers, oauth_challenge_verifier_key, oauth_prep.challenge_verifier)
			return response
		}
		case '/oauth/callback/github': {
			const result = await oauth.get_userid_by_code({
				auth_code: url.searchParams.get('code'),
				challenge_verifier: get_cookies(req.headers)[oauth_challenge_verifier_key],
				state: {
					from_url: url.searchParams.get('state'),
					from_session: get_cookies(req.headers)[oauth_state_key]
				}
			})
			if (result.ok) {
				const response = new Response(null, {
					status: 302,
					headers: {
						location: '/',
					}
				})
				// 短期 session 更容易过期，方便演示
				set_cookie(response.headers, session_key, result.value.toString())
				return response
			}
			return new Response(result.error.key)
		}
		case '/logout': {
			return new Response('logged out', {
				headers: {
					'Set-Cookie': `${session_key}=; Max-Age=0; Path=/; SameSite=Lax; HttpOnly`,
				}
			})
		}
	}

	return new Response('Not Found', { status: 404 })
}

console.log(`GitHub OAuth demo server: http://localhost:3000`)
Deno.serve({ port: 3000 }, handler)
