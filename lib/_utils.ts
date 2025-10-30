export
function is_real_str(s: unknown): s is string {
    return typeof(s) === 'string' && s.length > 0
}
