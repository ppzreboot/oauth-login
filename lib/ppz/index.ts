import {
	type I_result,
	type I_async_result,
	type I_result_error_with_key,
	error_result,
} from './result.ts'

export * from './result.ts'

export
function is_real_str(s: unknown): s is string {
	return typeof(s) === 'string' && s.length > 0
}

export
function dont_throw<T>(job: () => T): I_result<T, unknown> {
	try {
		return { ok: true, value: job() }
	} catch (error) {
		return { ok: false, error }
	}
}

export
async function dont_throw_async<T>(job: () => Promise<T>): I_async_result<T, unknown> {
	try {
		return { ok: true, value: await job() }
	} catch (error) {
		return { ok: false, error }
	}
}


type I_json_value =
	| string
	| number
	| boolean
	| null
	| I_json_obj
	| I_json_array
type I_json_obj = { [key: string]: I_json_value }
type I_json_array = I_json_value[]

export
type I_error_key__retrieve_json_body
	= 'connection error'
	| 'invalid json'
	| 'primitive json'

export
async function retrieve_json_body(response: Response):
	I_async_result<I_json_obj | I_json_array, I_result_error_with_key<I_error_key__retrieve_json_body>> {
	let body_str: string
	try {
		body_str = await response.text()
	} catch (error) {
		return error_result('connection error', error)
	}
	let body: I_json_value
	try {
		body = JSON.parse(body_str)
	} catch (error) {
		return error_result('invalid json', error)
	}
	if (typeof(body) !== 'object' || body === null)
		return error_result('primitive json', null)
	return { ok: true, value: body }
}
