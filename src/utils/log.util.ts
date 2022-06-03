export function log(message: string, title?: string) {
    if (!title) {
        console.log('[???]', message);
    } else {
        console.log(`[${title}]`, message);
    }
}
