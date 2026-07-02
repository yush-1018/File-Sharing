import { ZodError } from 'zod';
export function errorHandler(err, _req, res, _next) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation error',
            details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
    }
    if (err instanceof Error) {
        const status = err.status || 500;
        return res.status(status).json({ error: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
}
/** Wrap async route handler to forward errors to errorHandler */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
