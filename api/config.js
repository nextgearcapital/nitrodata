module.exports = {
    backend: {
        user: process.env.NITRO_DB_USER || '',
        password: process.env.NITRO_DB_PASSWORD || '',
        server: process.env.NITRO_DB_SERVER || 'localhost',
        database: process.env.NITRO_DB_NAME || 'AdventureWorks2012',
        options: {
            port: process.env.NITRO_DB_PORT || 1433,
			encryption_key: process.env.NITRO_DB_ENCRYPTION_KEY || 'MyKey',
			encryption_cert: process.env.NITRO_DB_ENCRYPTION_CERT || 'MyCertificate'
        }
    },
    adaptor: process.env.NITRO_BACKEND || 'mssql_adaptor',
    logging: {
        level: 'debug'
    },
    default_create_mode: process.env.NITRO_DEFAULT_CREATE_MODE || 'createIfDoesNotExist', // other options: createNew, useExisting
    default_namespace: process.env.NITRO_DEFAULT_NAMESPACE || 'dbo', // jshint ignore:line
    model_overrides: process.env.NITRO_MODEL_OVERRIDES || 'examples/adventureworks/overrides/', // jshint ignore:line
    host: process.env.NITRO_HOST || 'localhost',
    port: process.env.NITRO_PORT || 3000
};
