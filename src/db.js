
import { join } from 'path';
import { readdirSync } from 'fs';
import { config } from 'dotenv';
import Sequelize from 'sequelize';

export default async () => {
    // Load environment variables
    process.env.NODE_ENV = process.env.NODE_ENV || 'development';
    config({ path: join(process.cwd(), `.env.${process.env.NODE_ENV}`) });

    // connect to database
    const cfg = getConfigFromEnvVars();
    const sequelize = new Sequelize(cfg.database, cfg.username, cfg.password, cfg);

    // define models    
    const models = {};
    const dir = join(process.cwd(), 'models');
    const files = readdirSync(dir).filter(file => !file.startsWith('.') && file.endsWith('.js'));
    for (let i = 0; i < files.length; i++) {
        const fn = await import(join(dir, files[i]));
        const model = fn.default(sequelize, Sequelize);
        models[model.name] = model;
    }

    // run assiciations
    Object.keys(models).forEach(modelName => {
        if (models[modelName].associate) {
            models[modelName].associate(models);
        }
    });

    // sync all models
    await Promise.all(Object.values(models).map(model => model.sync()));

    // return models
    return models;
};

/**
 * @name getConfigFromEnvVars
 * @desc Generates database connection configuration from environment variables
 * @private
 */
function getConfigFromEnvVars() {
    const { create, assign, keys } = Object;
    return assign(create(null),
        ...keys(process.env)
            .filter(key => key.startsWith('DB_'))
            .map(key => ({ [key.substring(3).toLowerCase()]: process.env[key] }))
    );
}
