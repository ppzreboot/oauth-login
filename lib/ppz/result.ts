export
interface I_result__success<T> {
	ok: true
	value: T
}
export
interface I_result__error<E> {
	ok: false
	error: E
}
export
type I_result<T, E> = I_result__success<T> | I_result__error<E>

export
interface I_result_error_with_key<K extends string, E = unknown> {
	key: K
	error: E
}

export
type I_async_result<T, E> = Promise<I_result<T, E>>

export
function error_result<K extends string, E>(key: K, error: E):
	I_result__error<I_result_error_with_key<K, E>> {
	return {
		ok: false,
		error: { key, error },
	}
}
