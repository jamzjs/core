import Koa from 'koa';
import koaBody from 'koa-body';
import { HttpError } from './error';
import db from './db';
import { execControllerMethod, loadControllers } from './controller';
import { name, version } from '../package';

(async () => {
    const app = new Koa();
    const port = process.env.PORT || 3000;

    // configure app
    app.use(koaBody());

    // configure database connection and load models
    app.context.db = await db();

    // load controllers
    await loadControllers();

    // x-response-time
    app.use(async (ctx, next) => {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        ctx.set('X-Response-Time', `${ms}ms`);
        ctx.set('X-Powered-By', `${name} ${version}`);
    });

    // configure request/response headers and define body
    app.use(async (ctx, next) => {
        // set accepts header
        ctx.accepts('application/json');

        // set content-type header
        ctx.set('content-type', 'application/json');

        // set default body
        ctx.body = {};

        await next();
    });

    // execute controller or throw an error
    app.use(async (ctx, next) => {
        try {
            await execControllerMethod(ctx);
        } catch (err) {
            ctx.status = 500; // internal server error
            if (err instanceof HttpError) {
                ctx.status = err.code;
            }
            ctx.body = {
                error: err.message,
                stack: err.stack,
                code: err.code,
            };
        }
        await next();
    });

    app.listen(port);
})().catch(console.error);