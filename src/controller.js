import { readdirSync } from 'fs';
import { join, basename } from 'path';
import {
    NotFoundError,
    MethodNotAllowedError,
    ModelNotDefinedError
} from "./error";

/**
 * @class Controller
 * @classdesc Main controller
 */
export class Controller {

    /**
     * @desc Method to http method linking
     * @static
     */
    static methods = {
        create: 'post',
        read: 'get',
        update: 'put',
        delete: 'delete',
    };

    /**
     * @name getMethods
     * @desc Returns concatinated object of methods linking from Controller
     *       and the extending classes.
     * @returns {object}
     */
    static getMethods() {
        return Object.assign({},
            Controller.methods,
            this.methods);
    };

    /**
     * @constructor
     * @param {Context} ctx 
     */
    constructor(ctx) {
        this.ctx = ctx;
        this.db = ctx.db;
        this.req = ctx.req;
        this.res = ctx.res;
        const { model } = this.constructor;
        if (!model || !(model in this.db)) {
            throw new ModelNotDefinedError();
        }
        this.model = this.db[model];
    }

    /**
     * @name status
     * @desc Sets the response http status
     * @public
     */
    status(status = 200) {
        this.ctx.status = status;
    }

    /**
     * @name create
     * @desc Default create methods. Creates instance received in body
     *       to database using the defined model;
     * @async
     */
    async create() {
        const { body } = this.req;
        return await this.model.create(body);
    }

    /**
     * @name read
     * @desc Default read method. Reads from database using query string
     *       as filters in where clause.
     * @async
     */
    async read() {
        return await this.model.findAll({ where: this.ctx.query });
    }

    async update() {

    }

    async delete() {

    }

}

const controllers = {};

/**
 * @name execControllerMethod
 * @desc Executes controller method with context
 * @param {Context} ctx 
 * @public
 */
export async function execControllerMethod(ctx) {
    const { path } = ctx;
    const [controller, method] = path.split('/').slice(1);
    if (!controller || !method || !(controller in controllers)) {
        throw new NotFoundError();
    }
    const ctrl = new controllers[controller](ctx);
    if (!(method in ctrl)) {
        throw new MethodNotAllowedError();
    }
    const methods = controllers[controller].getMethods();
    if (method in methods && methods[method].toUpperCase() !== ctx.method) {
        throw new MethodNotAllowedError();
    }
    ctx.body = await ctrl[method]();
}

/**
 * @name loadControllers
 * @desc Load controllers from files
 * @public
 */
export async function loadControllers() {
    const dir = join(process.cwd(), 'controllers');
    const files = readdirSync(dir).filter(file => !file.startsWith('.') && file.endsWith('.js'));
    for (let i = 0; i < files.length; i++) {
        const fn = await import(join(dir, files[i]));
        const controllerName = basename(files[i], '.js');
        controllers[controllerName] = fn.default;
    }
}