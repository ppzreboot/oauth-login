import type { I_userinfo } from './_type'
import { OAUTH_ERROR, OAUTH_ERROR__GET_TOKEN, OAUTH_ERROR__GET_USERINFO } from './_error'
import { is_real_str } from './_utils'

/**
 * Step 1
 * Direct the user to GitHub's authorization page.
 */
export
function get_github_login_url(client_id: string) {
    return 'https://github.com/login/oauth/authorize?client_id=' + client_id
}

/**
 * ## Step 2.1
 * Exchange the authorization code for an access token.
 * This step is "Your APP(client id + client secret) use the user's identity(auth code) to login to Github".
 */
export
async function get_token_by_code(code: string, client_id: string, client_secret: string):
    Promise<[OAUTH_ERROR__GET_TOKEN, null] | [0, string]>
{
    if (code.length === 0)
        return [OAUTH_ERROR__GET_TOKEN.empty_code, null]
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
    const data = await response.json()
    switch (data.error) {
        case 'bad_verification_code':
            return [OAUTH_ERROR__GET_TOKEN.invalid_code, null]
        case 'incorrect_client_credentials':
            return [OAUTH_ERROR__GET_TOKEN.incorrect_client_credentials, null]
        case undefined: {
            const access_token = data.access_token
            if (typeof(access_token) === 'string')
                return [0, access_token]
            return [OAUTH_ERROR__GET_TOKEN.got_invalid_token, null]
        }
        default:
            console.error('Unexpected error from github get_token_by_code:')
            console.error(data)
            throw [OAUTH_ERROR__GET_TOKEN.unknown, null]
    }
}

interface I_github_userinfo extends I_userinfo {
    name: string
    email: string
}

/**
 * Step 2.2
 * Use the access token to get the user's information.
 */
export
async function get_userinfo_by_token(access_token: string):
    Promise<[OAUTH_ERROR__GET_USERINFO, null] | [0, I_github_userinfo]>
{
    const response = await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + access_token,
        },
    })
    const data = await response.json()
    switch (data.message) {
        case 'Bad credentials':
            return [OAUTH_ERROR__GET_USERINFO.invalid_token, null]
        case undefined: {
            const id = data.id + ''
            const name = data.login
            const email = data.email
            if (is_real_str(id) && is_real_str(name) && is_real_str(email))
                return [0, { id, name, email }]
        }
        default:
            console.error('Unexpected error from github get_userinfo_by_token:')
            console.error(data)
            return [OAUTH_ERROR__GET_USERINFO.unknown, null]
    }
}

/**
 * Step 2
 * Exchange the authorization code for an access token,
 * then use the access token to get the user's information.
 */
export
async function get_userinfo_by_code(code: string, client_id: string, client_secret: string):
    Promise<[OAUTH_ERROR, null] | [0, I_github_userinfo]>
{
    const [err, token] = await get_token_by_code(code, client_id, client_secret)
    if (err !== 0)
        return [err, null]
    return await get_userinfo_by_token(token)
}
